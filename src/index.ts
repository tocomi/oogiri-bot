import { App } from '@slack/bolt'
import { config } from './config'
import { countKotae, createKotae } from './kotae/KotaeAction'
import { createOdai, finish, startVoting } from './odai/OdaiAction'

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

const main = async () => {
  await app.start(PORT)
  console.log('⚡️ Bolt app started')
}

main()
