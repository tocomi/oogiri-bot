import { getSlackClient } from '../slack/client'
import { config } from '../config'
import { inspireNewOdai as inspireNewOdaiAction } from '../slack/handlers/odai/action/inspireNewOdai'
import { OdaiService } from '../odai/OdaiService'

export const inspireNewOdai = async ({
  odaiService,
}: {
  odaiService: OdaiService
}) => {
  const client = getSlackClient()
  const slackTeamId = config.slack.teamId

  await inspireNewOdaiAction({ slackTeamId, client, odaiService })
}
