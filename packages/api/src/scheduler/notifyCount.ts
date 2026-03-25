import { getSlackClient } from '../slack/client'
import { config } from '../config'
import { countKotae } from '../slack/handlers/kotae/action/countKotae'
import { countVote } from '../slack/handlers/vote/action/countVote'
import { KotaeService } from '../kotae/KotaeService'
import { VoteService } from '../vote/VoteService'

export const notifyCount = async ({
  kotaeService,
  voteService,
}: {
  kotaeService: KotaeService
  voteService: VoteService
}) => {
  const client = getSlackClient()
  const slackTeamId = config.slack.teamId

  await countKotae({ slackTeamId, client, isScheduler: true, kotaeService })
  await countVote({ slackTeamId, client, isScheduler: true, voteService })
}
