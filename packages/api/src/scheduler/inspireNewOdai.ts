import { config } from '../config'
import { OdaiService } from '../odai/OdaiService'
import { getSlackClient } from '../slack/client'
import { inspireNewOdai as inspireNewOdaiAction } from '../slack/handlers/odai/action/inspireNewOdai'

export const inspireNewOdai = async ({
  odaiService,
}: {
  odaiService: OdaiService
}) => {
  const client = getSlackClient()
  const slackTeamId = config.slack.teamId

  await inspireNewOdaiAction({ slackTeamId, client, odaiService })
}
