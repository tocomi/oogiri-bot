import {
  App,
  BlockAction,
  InteractiveMessage,
  KnownBlock,
  SlackShortcut,
  WorkflowStepEdit,
} from '@slack/bolt'
import { Logger, WebClient } from '@slack/web-api'
import emojiRegex from 'emoji-regex'
import { OdaiUseCase } from '../odai/OdaiUseCase'
import { postMessage, postEphemeral, postInternalErrorMessage } from '../slack/postMessage'
import { getSlackUserList } from '../util/getSlackUserList'
import { medalEmoji } from '../vote/util'
import { KotaeUseCase } from './KotaeUseCase'
import { countKotae } from './action/countKotae'
import { kotaeCreatedBlocks } from './blocks'
import { kotaeIpponCreatedBlocks } from './blocks/kotaeIpponCreatedBlocks'
import { makePointRanking } from './rank/makePointRanking'
import {
  kotaeCreateView,
  KOTAE_CREATE_ACTION_ID,
  KOTAE_CREATE_BLOCK_ID,
  KOTAE_CREATE_CALLBACK_ID,
} from './view/KotaeCreateView'

export const CREATE_KOTAE_ACTION_ID = 'oogiri-create-kotae'

const create = async ({
  body,
  client,
  logger,
}: {
  body: SlackShortcut | BlockAction | InteractiveMessage | WorkflowStepEdit
  client: WebClient
  logger: Logger
}) => {
  const result = await client.views.open(kotaeCreateView(body.trigger_id)).catch(async (e) => {
    logger.error(e)
  })
  if (result && result.error) {
    logger.error(result.error)
  }
}

export const createKotae = (app: App) => {
  // NOTE: ショートカットからの回答
  app.shortcut(CREATE_KOTAE_ACTION_ID, async ({ ack, body, client, logger }) => {
    await ack()
    await create({ body, client, logger })
  })
  // NOTE: ボタンからの回答
  app.action(CREATE_KOTAE_ACTION_ID, async ({ ack, body, client, logger }) => {
    await ack()
    if ('trigger_id' in body) {
      await create({ body, client, logger })
    }
  })

  app.view(KOTAE_CREATE_CALLBACK_ID, async ({ ack, view, client, body, logger }) => {
    const kotae = view.state.values[KOTAE_CREATE_BLOCK_ID][KOTAE_CREATE_ACTION_ID].value
    if (!kotae) {
      await ack()
      return
    }

    // NOTE: 絵文字は投票できない問題があるのでここで弾く
    const regex = emojiRegex()
    const isEmojiContained = kotae.match(regex)
    if (isEmojiContained) {
      await ack({
        response_action: 'errors',
        errors: {
          [KOTAE_CREATE_BLOCK_ID]: 'まだ絵文字は未対応なのです、ごめんなさい。',
        },
      })
      logger.info('kotae containing emoji is sent.')
      return
    }

    await ack()

    const kotaeUseCase = new KotaeUseCase()
    const success = await kotaeUseCase
      .create({
        slackTeamId: view.team_id,
        content: kotae,
        createdBy: body.user.id,
      })
      .then(() => true)
      .catch((error) => {
        if (error.response.data.message === 'No Active Odai') {
          logger.warn(error.response.data.message)
          const blocks: KnownBlock[] = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':warning: お題が開始されていません :warning:',
              },
            },
          ]
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(error.response.config)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return false
      })
    if (!success) return

    const odaiUseCase = new OdaiUseCase()
    const { odai } = await odaiUseCase.getCurrent({ slackTeamId: view.team_id })
    if (odai.type === 'ippon') {
      const blocks: KnownBlock[] = kotaeIpponCreatedBlocks(kotae)
      await postMessage({
        client,
        blocks,
      })
      return
    }
    const blocks: KnownBlock[] = kotaeCreatedBlocks(kotae)
    await postEphemeral({
      client,
      user: body.user.id,
      blocks,
    })
  })
}

export const countKotaeAction = (app: App) => {
  app.command('/oogiri-count-kotae', async ({ ack, body, client }) => {
    await ack()
    await countKotae({ slackTeamId: body.team_id, userId: body.user_id, client })
  })
}

export const checkResult = (app: App) => {
  app.command('/oogiri-check-my-result', async ({ ack, body, client, logger }) => {
    await ack()
    const kotaeUseCase = new KotaeUseCase()
    const result = await kotaeUseCase
      .getPersonalResult({ slackTeamId: body.team_id, userId: body.user_id })
      .catch((error) => {
        if (error.response.data.message === 'No Finished Odai') {
          logger.warn(error.response.data.message)
          const blocks: KnownBlock[] = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':warning: 結果を表示するお題がありません :warning:',
              },
            },
          ]
          postEphemeral({ client, user: body.user_id, blocks })
        } else {
          logger.error(error.response.config)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return undefined
      })
    if (!result || !result.kotaeList.length) {
      const blocks: KnownBlock[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':warning: 直近のお題の結果がありません :warning:',
          },
        },
      ]
      postEphemeral({ client, user: body.user_id, blocks })
      return
    }
    const headerBlocks: KnownBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:bar_chart: :bar_chart: :bar_chart: *直近のあなたの回答結果* :bar_chart: :bar_chart: :bar_chart:`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:speech_balloon: *お題: ${result.odaiTitle}*`,
        },
      },
    ]

    const userIdList = result.kotaeList
      .map((kotae) => kotae.votedByList)
      .flat()
      .map((votedBy) => votedBy.votedBy)
    const userInfoMap = await getSlackUserList({ client, userIdList })
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const resultBlocks: KnownBlock[] = makePointRanking({
      kotaeList: result.kotaeList,
      removeNoVoteKotae: false,
      filterTopKotae: false,
    })
      .map((kotae) => {
        const blocks: KnownBlock[] = [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:dart: *${kotae.point}ポイント* - :first_place_medal:${kotae.votedFirstCount}票 :second_place_medal:${kotae.votedSecondCount}票 :third_place_medal:${kotae.votedThirdCount}票 - ${kotae.content}`,
            },
          },
        ]
        if (kotae.votedByList.length > 0) {
          kotae.votedByList
            .sort((a, b) => a.rank - b.rank)
            .forEach((votedBy) => {
              const user = userInfoMap[votedBy.votedBy]
              if (!user) return

              blocks.push({
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `${medalEmoji(votedBy.rank)}`,
                  },
                  {
                    type: 'image',
                    image_url: user.profile?.image_32 || '',
                    alt_text: 'user_image',
                  },
                  {
                    type: 'mrkdwn',
                    text: `*${user.profile?.display_name}*`,
                  },
                ],
              })
            })
        }
        return blocks
      })
      .flat()
    const blocks = [...headerBlocks, ...resultBlocks]
    await postEphemeral({ client, user: body.user_id, blocks })
  })
}
