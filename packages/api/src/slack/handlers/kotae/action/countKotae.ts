import { KnownBlock } from '@slack/types'
import { WebClient } from '@slack/web-api'
import { getCharacterMessage } from '../../../../message'
import {
  postEphemeral,
  postInternalErrorMessage,
  postMessage,
} from '../../../postMessage'
import {
  milliSecondsToYYYYMMDD,
  diffMessageFromCurrent,
  calculateDateDiff,
} from '../../../../util/DateUtil'
import { KotaeService } from '../../../../kotae/KotaeService'
import { hasError } from '../../../../api/Error'

// NOTE: OdaiHandlerのSTART_VOTING_ACTION_IDに対応
const START_VOTING_ACTION_ID = 'oogiri-start-voting'
// NOTE: KotaeHandlerのCREATE_KOTAE_ACTION_IDに対応
const CREATE_KOTAE_ACTION_ID = 'oogiri-create-kotae'

export const countKotae = async ({
  slackTeamId,
  client,
  userId,
  isScheduler = false,
  kotaeService,
}: {
  slackTeamId: string
  client: WebClient
  userId?: string
  isScheduler?: boolean
  kotaeService: KotaeService
}) => {
  const response = await kotaeService.getAllOfCurrentOdai({ slackTeamId })
  if (hasError(response)) {
    if (response.message === 'No Active Odai') {
      console.warn(response.message)
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
      console.error(response.message)
      if (userId) postInternalErrorMessage({ client, user: userId })
    }
    return
  }

  const kotaeCount = response.kotaeList.length
  const uniqueUserCount = [
    ...new Set(response.kotaeList.map((k) => k.createdBy)),
  ].length
  const odaiDueDate = response.odaiDueDate
  const odaiStatus = response.odaiStatus

  // NOTE: スケジューラー実行では回答受付中のみ実行
  if (isScheduler && odaiStatus !== 'posting') return

  // NOTE: 期日の当日かそれ以降の場合は投票開始ボタンを表示する
  const displayStartVotingButton = calculateDateDiff(odaiDueDate) <= 0

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
        text: `:ninja: *参加者: ${uniqueUserCount}人* :speaking_head_in_silhouette: *回答数: ${kotaeCount}*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:speech_balloon: お題: ${response.odaiTitle}`,
      },
    },
  )
  if (response.odaiImageUrl) {
    blocks.push({
      type: 'image',
      image_url: response.odaiImageUrl,
      alt_text: 'odai image',
    })
  }
  blocks.push(
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:calendar: 回答期限: ${milliSecondsToYYYYMMDD(
          odaiDueDate,
        )} (${diffMessageFromCurrent(odaiDueDate)})`,
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
    },
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
