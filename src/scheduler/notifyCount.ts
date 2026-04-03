import { config } from '../config'
import { KotaeService } from '../kotae/KotaeService'
import { getSlackClient } from '../slack/client'
import { countKotae } from '../slack/handlers/kotae/action/countKotae'
import { countVote } from '../slack/handlers/vote/action/countVote'
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
