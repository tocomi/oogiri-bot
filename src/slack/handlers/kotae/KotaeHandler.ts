import { App, BlockAction, KnownBlock } from '@slack/bolt'
import emojiRegex from 'emoji-regex'
import { countKotae } from './action/countKotae'
import {
  kotaeCreateView,
  KOTAE_CREATE_BLOCK_ID,
  KOTAE_CREATE_ACTION_ID,
  KOTAE_CREATE_CALLBACK_ID,
} from './view/KotaeCreateView'
import { hasError } from '../../../api/Error'
import { KotaeService } from '../../../kotae/KotaeService'
import { createPersonalCommentaryBlocks } from '../../../kotae/blocks/createPersonalCommentaryBlocks'
import { kotaeCreatedBlocks } from '../../../kotae/blocks/kotaeCreatedBlocks'
import { makePointRanking } from '../../../kotae/rank/makePointRanking'
import { OdaiService } from '../../../odai/OdaiService'
import { getSlackUserList } from '../../../util/getSlackUserList'
import { medalEmoji } from '../../../vote/util'
import {
  CHECK_PERSONAL_COMMENTARY_ACTION_ID,
  CREATE_KOTAE_ACTION_ID,
} from '../../actionIds'
import { postEphemeral, postInternalErrorMessage } from '../../postMessage'

export const registerKotaeHandlers = ({
  app,
  kotaeService,
  odaiService,
}: {
  app: App
  kotaeService: KotaeService
  odaiService: OdaiService
}) => {
  // NOTE: ショートカット/ボタンからの回答モーダルオープン
  app.shortcut(
    CREATE_KOTAE_ACTION_ID,
    async ({ ack, body, client, logger }) => {
      await ack()
      const result = await client.views
        .open(kotaeCreateView(body.trigger_id))
        .catch(async (e) => {
          logger.error(e)
        })
      if (result && result.error) logger.error(result.error)
    },
  )
  app.action(CREATE_KOTAE_ACTION_ID, async ({ ack, body, client, logger }) => {
    await ack()
    if ('trigger_id' in body) {
      const result = await client.views
        .open(kotaeCreateView(body.trigger_id))
        .catch(async (e) => {
          logger.error(e)
        })
      if (result && result.error) logger.error(result.error)
    }
  })

  // NOTE: 回答の作成
  app.view(
    KOTAE_CREATE_CALLBACK_ID,
    async ({ ack, view, client, body, logger }) => {
      const kotae =
        view.state.values[KOTAE_CREATE_BLOCK_ID][KOTAE_CREATE_ACTION_ID].value
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
            [KOTAE_CREATE_BLOCK_ID]:
              'まだ絵文字は未対応なのです、ごめんなさい。',
          },
        })
        logger.info('kotae containing emoji is sent.')
        return
      }

      await ack()

      const result = await kotaeService.create({
        id: '',
        slackTeamId: view.team_id,
        content: kotae,
        createdBy: body.user.id,
      })
      if (hasError(result)) {
        if (result.message === 'No Active Odai') {
          logger.warn(result.message)
          const blocks: KnownBlock[] = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':warning: お題が開始されていません :warning:',
              },
            },
          ]
          await postEphemeral({ client, user: body.user.id, blocks })
        } else {
          logger.error(result.message)
          await postInternalErrorMessage({ client, user: body.user.id })
        }
        return
      }

      const odaiResult = await odaiService.getCurrent({
        slackTeamId: view.team_id,
      })
      if (hasError(odaiResult)) {
        logger.error(odaiResult.message)
        postInternalErrorMessage({ client, user: body.user.id })
        return
      }

      const blocks: KnownBlock[] = kotaeCreatedBlocks(kotae)
      await postEphemeral({ client, user: body.user.id, blocks })
    },
  )

  // NOTE: 回答数の確認コマンド
  app.command('/oogiri-count-kotae', async ({ ack, body, client }) => {
    await ack()
    await countKotae({
      slackTeamId: body.team_id,
      userId: body.user_id,
      client,
      kotaeService,
    })
  })

  // NOTE: 個人成績の確認コマンド
  app.command(
    '/oogiri-check-my-result',
    async ({ ack, body, client, logger }) => {
      await ack()
      await postEphemeral({
        client,
        user: body.user_id,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '集計しています、少々お待ちください⌛\n数分かかる場合があります。',
            },
          },
        ],
      })
      const result = await kotaeService.getPersonalResult({
        slackTeamId: body.team_id,
        userId: body.user_id,
      })
      if (hasError(result)) {
        if (result.message === 'No Finished Odai') {
          logger.warn(result.message)
          const blocks: KnownBlock[] = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':warning: 結果を表示するお題がありません :warning:',
              },
            },
          ]
          await postEphemeral({ client, user: body.user_id, blocks })
        } else {
          logger.error(result.message)
          await postInternalErrorMessage({ client, user: body.user_id })
        }
        return
      }

      if (!result.kotaeList.length) {
        const blocks: KnownBlock[] = [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: ':warning: 直近のお題の結果がありません :warning:',
            },
          },
        ]
        await postEphemeral({ client, user: body.user_id, blocks })
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

      const commentaryButtonBlock: KnownBlock = {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: ':microphone: 講評してもらう(他の人には見えません)',
            },
            action_id: CHECK_PERSONAL_COMMENTARY_ACTION_ID,
            style: 'primary',
          },
        ],
      }
      const blocks = [...headerBlocks, ...resultBlocks, commentaryButtonBlock]
      await postEphemeral({ client, user: body.user_id, blocks })
    },
  )

  // NOTE: 個人の講評確認
  app.action(
    CHECK_PERSONAL_COMMENTARY_ACTION_ID,
    async ({ ack, body, client, logger }) => {
      await ack()
      const blockAction = body as BlockAction
      const slackTeamId = blockAction.team?.id
      const userId = blockAction.user.id
      if (!slackTeamId) {
        await postInternalErrorMessage({ client, user: userId })
        return
      }

      await postEphemeral({
        client,
        user: userId,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '講評しています、少々お待ちください⌛\n講評の生成も含めて、数分かかる場合があります。',
            },
          },
        ],
      })

      const result = await kotaeService.getPersonalCommentary({
        slackTeamId,
        userId,
      })
      if (hasError(result)) {
        if (result.message === 'No Target Kotae') {
          logger.warn(result.message)
          const blocks: KnownBlock[] = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':warning: 直近のお題への回答がありません :warning:',
              },
            },
          ]
          await postEphemeral({ client, user: userId, blocks })
        } else {
          logger.error(result.message)
          await postInternalErrorMessage({ client, user: userId })
        }
        return
      }

      const blocks = createPersonalCommentaryBlocks(
        result.odaiTitle,
        result.commentary,
      )
      await postEphemeral({ client, user: userId, blocks })
    },
  )
}
