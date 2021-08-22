import { KnownBlock, WebClient } from '@slack/web-api'
import { postEphemeral, postInternalErrorMessage, postMessage } from '../../message/postMessage'
import { milliSecondsToYYYYMMDD, diffMessageFromCurrent } from '../../util/DateUtil'
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

  const blocks: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':mega: *現在の回答状況* :mega:',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:speech_balloon: お題: ${result.odaiTitle}`,
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
            text: 'お題に回答する (複数回答可)',
          },
          style: 'primary',
          action_id: 'oogiri-create-kotae',
        },
      ],
    },
  ]
  await postMessage({ client, blocks })
}
