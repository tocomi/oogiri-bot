import { App } from '@slack/bolt'
import { config } from './config'
import { checkResult, countKotaeAction, createKotae } from './kotae/KotaeAction'
import { createOdai, finishOdai, startVoting } from './odai/OdaiAction'
import { checkVoteResult, countVoteAction, voteKotaeIppon } from './vote/VoteAction'

const app = new App({
  socketMode: true,
  token: config.slack.botToken,
  appToken: config.slack.appToken,
})

const PORT = 5000

createOdai(app)
startVoting(app)
finishOdai(app)

createKotae(app)
countKotaeAction(app)
checkResult(app)

countVoteAction(app)
checkVoteResult(app)
voteKotaeIppon(app)

const main = async () => {
  await app.start(PORT)
  console.log('⚡️ Bolt app started')
}

main()
