import { App } from '@slack/bolt'
import { config } from '../config'
import { notifyKotaeCount } from './notifyKotaeCount'
import { notifyVoteCount } from './notifyVoteCount'

const app = new App({
  // NOTE: ソケットモードである必要はないが、そうしないとエラーが出てしまう
  socketMode: true,
  token: config.slack.botToken,
  appToken: config.slack.appToken,
})

const run = async () => {
  const slackTeamId = config.slack.teamId
  const client = app.client

  await notifyKotaeCount({ slackTeamId, client })
  await notifyVoteCount({ slackTeamId, client })
}

run()
