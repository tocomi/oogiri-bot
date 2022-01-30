import { App } from '@slack/bolt'
import { config } from '../config'
import { inspireNewOdai } from '../odai/action/inspireNewOdai'

const app = new App({
  // NOTE: ソケットモードである必要はないが、そうしないとエラーが出てしまう
  socketMode: true,
  token: config.slack.botToken,
  appToken: config.slack.appToken,
})

inspireNewOdai({ slackTeamId: config.slack.teamId, client: app.client })
