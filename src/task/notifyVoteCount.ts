import { App } from '@slack/bolt'
import { config } from '../config'
import { countVote } from '../vote/action/countVote'

const app = new App({
  // NOTE: ソケットモードである必要はないが、そうしないとエラーが出てしまう
  socketMode: true,
  token: config.slack.botToken,
  appToken: config.slack.appToken,
})

countVote({ slackTeamId: config.slack.teamId, client: app.client, isScheduler: true })
