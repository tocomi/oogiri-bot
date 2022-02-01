import { App } from '@slack/bolt'
import { config } from '../config'
import { countKotae } from '../kotae/action/countKotae'
import { countVote } from '../vote/action/countVote'

const app = new App({
  // NOTE: ソケットモードである必要はないが、そうしないとエラーが出てしまう
  socketMode: true,
  token: config.slack.botToken,
  appToken: config.slack.appToken,
})

const run = async () => {
  const slackTeamId = config.slack.teamId
  const client = app.client

  await countKotae({ slackTeamId, client })
  await countVote({ slackTeamId, client })
}

run()
