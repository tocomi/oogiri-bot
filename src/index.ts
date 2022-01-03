import { App } from '@slack/bolt'
import { config } from './config'
import { checkResult, countKotaeAction, createKotae } from './kotae/KotaeAction'
import { createOdai, finish, startVoting } from './odai/OdaiAction'
import { countVoteAction } from './vote/VoteAction'

const app = new App({
  socketMode: true,
  token: config.slack.botToken,
  appToken: config.slack.appToken,
})

const PORT = 5000

createOdai(app)
startVoting(app)
finish(app)

createKotae(app)
countKotaeAction(app)
checkResult(app)

countVoteAction(app)

const main = async () => {
  await app.start(PORT)
  console.log('⚡️ Bolt app started')
}

main()
