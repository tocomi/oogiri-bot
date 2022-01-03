import { App } from '@slack/bolt'
import { countVote } from './action/countVote'

export const countVoteAction = (app: App) => {
  app.command('/oogiri-count-kusa', async ({ ack, body, client }) => {
    await ack()
    await countVote({ slackTeamId: body.team_id, userId: body.user_id, client })
  })
}
