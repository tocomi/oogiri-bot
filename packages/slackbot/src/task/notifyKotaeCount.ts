import { WebClient } from '@slack/web-api'
import { countKotae } from '../kotae/action/countKotae'

export const notifyKotaeCount = async ({
  slackTeamId,
  client,
}: {
  slackTeamId: string
  client: WebClient
}) => {
  await countKotae({ slackTeamId, client, isScheduler: true })
}
