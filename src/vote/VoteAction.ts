import { App, KnownBlock } from '@slack/bolt'
import { postEphemeral, postInternalErrorMessage } from '../message/postMessage'
import { getSlackUserList } from '../util/getSlackUserList'
import { VoteUseCase } from './VoteUseCase'
import { countVote } from './action/countVote'

export const countVoteAction = (app: App) => {
  app.command('/oogiri-count-kusa', async ({ ack, body, client }) => {
    await ack()
    await countVote({ slackTeamId: body.team_id, userId: body.user_id, client })
  })
}

export const checkVoteResult = (app: App) => {
  app.command('/oogiri-check-my-fans', async ({ ack, body, client, logger }) => {
    await ack()
    const voteUseCase = new VoteUseCase()
    const result = await voteUseCase
      .getVoteResult({
        slackTeamId: body.team_id,
        userId: body.user_id,
      })
      .catch((error) => {
        logger.error(error.response.config)
        postInternalErrorMessage({ client, user: body.user.id })
        return undefined
      })
    if (!result) return

    // NOTE: 対象はそれぞれ 5 件まで
    const _recent5timesCount = result.recent5timesCount.slice(0, 5)
    const _allCount = result.allCount.slice(0, 5)

    const userInfoMap = await getSlackUserList({
      client,
      userIdList: [..._recent5timesCount, ..._allCount].map((count) => count.votedBy),
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
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:timer_clock: *直近 5 戦*`,
        },
      }
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

        // NOTE: ワークスペースにいない人はスキップ
        if (!user) continue

        resultBlocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*${count.voteCount}票*`,
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
      }
    }

    // 累積
    resultBlocks.push(
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:chart_with_upwards_trend: *累計*`,
        },
      }
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

        // NOTE: ワークスペースにいない人はスキップ
        if (!user) continue

        resultBlocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*${count.voteCount}票*`,
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
      }
    }

    const blocks = [...headerBlocks, ...resultBlocks]
    await postEphemeral({ client, user: body.user_id, blocks })
  })
}
