import { KnownBlock } from '@slack/bolt'
import { WebClient } from '@slack/web-api'
import { FINISH_ODAI_ACTION_ID } from '../../odai/OdaiAction'
import { postEphemeral, postInternalErrorMessage, postMessage } from '../../slack/postMessage'
import { VoteUseCase } from '../VoteUseCase'

export const countVote = async ({
  slackTeamId,
  client,
  userId,
  isScheduler,
}: {
  slackTeamId: string
  client: WebClient
  userId?: string
  isScheduler?: boolean
}) => {
  const voteUseCase = new VoteUseCase()
  const result = await voteUseCase.getVoteCount({ slackTeamId }).catch((error) => {
    if (error.response.data.message === 'No Active Odai') {
      console.warn(error.response.data.message)
      const blocks: KnownBlock[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':warning: お題が開始されていません :warning:',
          },
        },
      ]
      if (userId) postEphemeral({ client, user: userId, blocks })
    } else if (
      error.response.data.message === 'No Voting Odai' ||
      error.response.data.message === 'No Target Kotae'
    ) {
      console.warn(error.response.data.message)
      const blocks: KnownBlock[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':warning: この投票は締め切られています :warning:',
          },
        },
      ]
      if (userId) postEphemeral({ client, user: userId, blocks })
    } else {
      console.error(error.response.config)
      if (userId) postInternalErrorMessage({ client, user: userId })
    }
    return undefined
  })
  if (!result) return
  // NOTE: スケジューラー実行では投票受付中のみ実行
  if (isScheduler && result.odaiStatus !== 'voting') return

  // NOTE: 投票人数が 10 人以上集まっていたら結果発表ボタンを表示する
  const displayFinishButton = result.uniqueUserCount >= 10

  const blocks: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'お疲れさまです！ ただいまの投票状況をお伝えしますね！',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:male_genie: *参加者: ${result.uniqueUserCount}人* :point_up: *投票数: ${result.voteCount}*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:speech_balloon: お題: ${result.odaiTitle}`,
      },
    },
  ]
  if (result.odaiImageUrl) {
    blocks.push({
      type: 'image',
      image_url: result.odaiImageUrl,
      alt_text: 'odai image',
    })
  }
  if (displayFinishButton) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '結果を発表する！',
          },
          style: 'primary',
          action_id: FINISH_ODAI_ACTION_ID,
        },
      ],
    })
  }
  await postMessage({ client, blocks })
}
