import { App } from '@slack/bolt'
import { config } from '../config'
import { countKotae } from '../kotae/action/countKotae'

const app = new App({
  // NOTE: ソケットモードである必要はないが、そうしないとエラーが出てしまう
  socketMode: true,
  token: config.slack.botToken,
  appToken: config.slack.appToken,
})

countKotae({ slackTeamId: config.slack.teamId, client: app.client, isScheduler: true })
