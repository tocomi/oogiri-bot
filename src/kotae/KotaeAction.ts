import {
  App,
  BlockAction,
  InteractiveMessage,
  KnownBlock,
  SlackShortcut,
  WorkflowStepEdit,
} from '@slack/bolt'
import { Logger, WebClient } from '@slack/web-api'
import { postEphemeral, postInternalErrorMessage } from '../message/postMessage'
import { getSlackUserList } from '../util/getSlackUserList'
import { RankedKotae } from './Kotae'
import { KotaeUseCase } from './KotaeUseCase'
import { countKotae } from './action/countKotae'
import { makePointRanking } from './rank/makePointRanking'

const CALLBACK_ID = 'create-kotae'
const BLOCK_ID = 'create-kotae-block'
const ACTION_ID = 'input'

const create = async ({
  body,
  client,
  logger,
}: {
  body: SlackShortcut | BlockAction | InteractiveMessage | WorkflowStepEdit
  client: WebClient
  logger: Logger
}) => {
  const result = await client.views
    .open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: CALLBACK_ID,
        title: {
          type: 'plain_text',
          text: 'お題への回答',
        },
        submit: {
          type: 'plain_text',
          text: '送信',
        },
        close: {
          type: 'plain_text',
          text: 'キャンセル',
        },
        blocks: [
          {
            type: 'input',
            block_id: BLOCK_ID,
            element: {
              type: 'plain_text_input',
              action_id: ACTION_ID,
              placeholder: {
                type: 'plain_text',
                text: '例: 〇〇が□□だ',
              },
            },
            label: {
              type: 'plain_text',
              text: '答え',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '誰かを不快にさせうる回答は控えましょう:relieved:',
            },
          },
        ],
      },
    })
    .catch(async (e) => {
      logger.error(e)
    })
  if (result && result.error) {
    logger.error(result.error)
  }
}

export const createKotae = (app: App) => {
  // NOTE: ショートカットからの回答
  app.shortcut('oogiri-create-kotae', async ({ ack, body, client, logger }) => {
    await ack()
    await create({ body, client, logger })
  })
  // NOTE: ボタンからの回答
  app.action('oogiri-create-kotae', async ({ ack, body, client, logger }) => {
    await ack()
    if ('trigger_id' in body) {
      await create({ body, client, logger })
    }
  })

  app.view(CALLBACK_ID, async ({ ack, view, client, body, logger }) => {
    await ack()
    const kotae = view.state.values[BLOCK_ID][ACTION_ID].value
    if (!kotae) return

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

    const blocks: KnownBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*回答を受け付けました！* :tada:`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `あなたの回答: ${kotae}`,
        },
      },
    ]
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

// TODO: 共通化
const medalEmoji = (rank: RankedKotae['rank']) => {
  switch (rank) {
    case 1:
      return ':first_place_medal:'
    case 2:
      return ':second_place_medal:'
    case 3:
      return ':third_place_medal:'
  }
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
        return [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:dart: *${kotae.point}ポイント* - :first_place_medal:${kotae.votedFirstCount}票 :second_place_medal:${kotae.votedSecondCount}票 :third_place_medal:${kotae.votedThirdCount}票 - ${kotae.content}`,
            },
          },
          {
            type: 'context',
            elements: kotae.votedByList
              .map((votedBy) => {
                const user = userInfoMap[votedBy.votedBy]
                if (!user) return []
                return [
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
                ]
              })
              .flat(),
          },
        ]
      })
      .flat()
    const blocks = [...headerBlocks, ...resultBlocks]
    await postEphemeral({ client, user: body.user_id, blocks })
  })
}
