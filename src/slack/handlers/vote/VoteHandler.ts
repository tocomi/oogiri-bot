import { App, KnownBlock } from '@slack/bolt'
import { countVote } from './action/countVote'
import { hasError } from '../../../api/Error'
import { decodeHtmlEntities } from '../../../util/decodeHtmlEntities'
import { getSlackUserList } from '../../../util/getSlackUserList'
import { logResult } from '../../../util/logResult'
import { VoteService } from '../../../vote/VoteService'
import {
  createVoteAlreadyBlocks,
  createVoteAlreadySameRankBlocks,
  createVoteCompleteBlocks,
} from '../../../vote/blocks'
import { convertVoteRank } from '../../../vote/convertVoteValue'
import { VOTING_ACTION_ID } from '../../actionIds'
import { postEphemeral, postInternalErrorMessage } from '../../postMessage'

export const registerVoteHandlers = ({
  app,
  voteService,
}: {
  app: App
  voteService: VoteService
}) => {
  // NOTE: 通常モードの投票
  app.action(
    VOTING_ACTION_ID,
    async ({ ack, action, body, client, logger }) => {
      await ack()
      // NOTE: 投票ボタンが押された回答のテキストを抽出
      // 何故か型が無いので仕方なくts-ignoreを使用
      // text -> ':speaking_head_in_silhouette: *kotae*'
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const text: string = body.message.blocks[0].text.text
      // NOTE: textから回答部分のみを抜き出し
      const content = decodeHtmlEntities(
        text.replace(':speaking_head_in_silhouette: ', '').replace(/\*/g, ''),
      )

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const voteRankText = action.selected_option.value
      const voteRank = convertVoteRank(voteRankText)

      const slackTeamId = body.team?.id || ''
      const user = body.user.id
      const result = logResult(
        'voteService.create',
        await voteService.create({
          id: '',
          slackTeamId,
          content,
          rank: voteRank,
          votedBy: user,
        }),
      )
      if (hasError(result)) {
        if (result.message === 'Already Voted') {
          logger.warn(result.message)
          const blocks = createVoteAlreadyBlocks({ content })
          await postEphemeral({ client, user, blocks })
        } else if (result.message === 'Already Same Rank Voted') {
          logger.warn(result.message)
          const blocks = createVoteAlreadySameRankBlocks({ voteRank })
          await postEphemeral({ client, user, blocks })
        } else {
          logger.error(result.message)
          await postInternalErrorMessage({ client, user })
        }
        return
      }
      const blocks = createVoteCompleteBlocks({ content, voteRank })
      await postEphemeral({ client, user, blocks })
    },
  )

  // NOTE: 投票数の確認コマンド
  app.command('/oogiri-count-kusa', async ({ ack, body, client }) => {
    await ack()
    await countVote({
      slackTeamId: body.team_id,
      userId: body.user_id,
      client,
      voteService,
    })
  })

  // NOTE: 自分のファンの確認コマンド
  app.command(
    '/oogiri-check-my-fans',
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
      const result = logResult(
        'voteService.getTotalVoteCountByUser',
        await voteService.getTotalVoteCountByUser({
          slackTeamId: body.team_id,
          userId: body.user_id,
        }),
      )
      if (hasError(result)) {
        logger.error(result.message)
        postInternalErrorMessage({ client, user: body.user_id })
        return
      }

      // NOTE: 対象はそれぞれ 5 件まで
      const _recent5timesCount = result.recent5timesCount.slice(0, 5)
      const _allCount = result.allCount.slice(0, 5)

      const userInfoMap = await getSlackUserList({
        client,
        userIdList: [..._recent5timesCount, ..._allCount].map(
          (count) => count.votedBy,
        ),
      })

      const headerBlocks: KnownBlock[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:smiling_face_with_3_hearts: :smiling_face_with_3_hearts: :smiling_face_with_3_hearts: *あなたの回答に投票した人 TOP5* :smiling_face_with_3_hearts: :smiling_face_with_3_hearts: :smiling_face_with_3_hearts:`,
          },
        },
      ]
      const resultBlocks: KnownBlock[] = []

      // 直近 5 戦
      resultBlocks.push(
        { type: 'divider' },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `:timer_clock: *直近 5 戦*` },
        },
      )
      if (!_recent5timesCount.length) {
        resultBlocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `結果がありません :smiling_face_with_tear`,
          },
        })
      } else {
        for (const count of _recent5timesCount) {
          const user = userInfoMap[count.votedBy]
          if (!user) continue
          resultBlocks.push({
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: `*${count.voteCount}票*` },
              {
                type: 'image',
                image_url: user.profile?.image_32 || '',
                alt_text: 'user_image',
              },
              { type: 'mrkdwn', text: `*${user.profile?.display_name}*` },
            ],
          })
        }
      }

      // 累計
      resultBlocks.push(
        { type: 'divider' },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:chart_with_upwards_trend: *累計*`,
          },
        },
      )
      if (!_allCount.length) {
        resultBlocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `結果がありません :smiling_face_with_tear`,
          },
        })
      } else {
        for (const count of _allCount) {
          const user = userInfoMap[count.votedBy]
          if (!user) continue
          resultBlocks.push({
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: `*${count.voteCount}票*` },
              {
                type: 'image',
                image_url: user.profile?.image_32 || '',
                alt_text: 'user_image',
              },
              { type: 'mrkdwn', text: `*${user.profile?.display_name}*` },
            ],
          })
        }
      }

      const blocks = [...headerBlocks, ...resultBlocks]
      await postEphemeral({ client, user: body.user_id, blocks })
    },
  )
}
