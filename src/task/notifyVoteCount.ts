import { WebClient } from '@slack/web-api'
import { countVote } from '../vote/action/countVote'

export const notifyVoteCount = async ({
  slackTeamId,
  client,
}: {
  slackTeamId: string
  client: WebClient
}) => {
  await countVote({ slackTeamId, client, isScheduler: true })
}
