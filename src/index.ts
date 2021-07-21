import { App } from '@slack/bolt'
import { config } from './config'
import { createKotae } from './kotae/KotaeAction'
import { createOdai, finish, startVoting } from './odai/OdaiAction'

const app = new App({
  socketMode: true,
  token: config.slack.botToken,
  appToken: config.slack.appToken,
})

createOdai(app)
createKotae(app)
startVoting(app)
finish(app)

const main = async () => {
  await app.start()
  console.log('⚡️ Bolt app started')
}

main()
