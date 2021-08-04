import { App } from '@slack/bolt'
import { config } from './config'
import { checkResult, countKotae, createKotae } from './kotae/KotaeAction'
import { createOdai, finish, startVoting } from './odai/OdaiAction'
import { countVote } from './vote/VoteAction'

const app = new App({
  socketMode: true,
  token: config.slack.botToken,
  appToken: config.slack.appToken,
})

const PORT = 5000

createOdai(app)
createKotae(app)
startVoting(app)
finish(app)
countKotae(app)
countVote(app)
checkResult(app)

const main = async () => {
  await app.start(PORT)
  console.log('⚡️ Bolt app started')
}

main()
