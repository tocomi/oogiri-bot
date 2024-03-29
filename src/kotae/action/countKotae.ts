import { KnownBlock } from '@slack/types'
import { WebClient } from '@slack/web-api'
import { getCharacterMessage } from '../../message'
import { START_VOTING_ACTION_ID } from '../../odai/OdaiAction'
import { postEphemeral, postInternalErrorMessage, postMessage } from '../../slack/postMessage'
import {
  milliSecondsToYYYYMMDD,
  diffMessageFromCurrent,
  calculateDateDiff,
} from '../../util/DateUtil'
import { CREATE_KOTAE_ACTION_ID } from '../KotaeAction'
import { KotaeUseCase } from '../KotaeUseCase'

export const countKotae = async ({
  slackTeamId,
  client,
  userId,
  isScheduler = false,
}: {
  slackTeamId: string
  client: WebClient
  userId?: string
  isScheduler?: boolean
}) => {
  const kotaeUseCase = new KotaeUseCase()
  const result = await kotaeUseCase.getKotaeCount({ slackTeamId }).catch((error) => {
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
    } else {
      console.error(error.response.config)
      if (userId) postInternalErrorMessage({ client, user: userId })
    }
    return undefined
  })
  if (!result) return
  // NOTE: スケジューラー実行では回答受付中のみ実行
  if (isScheduler && result.odaiStatus !== 'posting') return

  // NOTE: 期日の当日かそれ以降の場合は投票開始ボタンを表示する
  const displayStartVotingButton = calculateDateDiff(result.odaiDueDate) <= 0

  const blocks: KnownBlock[] = []
  blocks.push(
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: getCharacterMessage('kotae-status'),
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:ninja: *参加者: ${result.uniqueUserCount}人* :speaking_head_in_silhouette: *回答数: ${result.kotaeCount}*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:speech_balloon: お題: ${result.odaiTitle}`,
      },
    }
  )
  if (result.odaiImageUrl) {
    blocks.push({
      type: 'image',
      image_url: result.odaiImageUrl,
      alt_text: 'odai image',
    })
  }
  blocks.push(
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:calendar: 回答期限: ${milliSecondsToYYYYMMDD(
          result.odaiDueDate
        )} (${diffMessageFromCurrent(result.odaiDueDate)})`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'お題に回答する！ (複数回答可)',
          },
          style: 'primary',
          action_id: CREATE_KOTAE_ACTION_ID,
        },
      ],
    }
  )
  if (displayStartVotingButton) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '投票を開始する！',
          },
          style: 'primary',
          action_id: START_VOTING_ACTION_ID,
        },
      ],
    })
  }
  await postMessage({ client, blocks })
}
