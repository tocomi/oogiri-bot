import { KnownBlock } from '@slack/types'
import { WebClient } from '@slack/web-api'
import { hasError } from '../../../../api/Error'
import { getCharacterMessage } from '../../../../message'
import { VoteService } from '../../../../vote/VoteService'
import {
  postEphemeral,
  postInternalErrorMessage,
  postMessage,
} from '../../../postMessage'

// NOTE: OdaiHandlerのFINISH_ODAI_ACTION_IDに対応
const FINISH_ODAI_ACTION_ID = 'oogiri-finish'

export const countVote = async ({
  slackTeamId,
  client,
  userId,
  isScheduler = false,
  voteService,
}: {
  slackTeamId: string
  client: WebClient
  userId?: string
  isScheduler?: boolean
  voteService: VoteService
}) => {
  const result = await voteService.getVoteCount({ slackTeamId })
  if (hasError(result)) {
    if (result.message === 'No Active Odai') {
      console.warn(result.message)
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
      result.message === 'No Voting Odai' ||
      result.message === 'No Target Kotae'
    ) {
      console.warn(result.message)
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
      console.error(result.message)
      if (userId) postInternalErrorMessage({ client, user: userId })
    }
    return
  }

  // NOTE: スケジューラー実行では投票受付中のみ実行
  if (isScheduler && result.odaiStatus !== 'voting') return

  // NOTE: 投票人数が 10 人以上集まっていたら結果発表ボタンを表示する
  const displayFinishButton = result.uniqueUserCount >= 10

  const blocks: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: getCharacterMessage('vote-status'),
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
