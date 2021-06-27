import { App } from '@slack/bolt'
import * as dotenv from 'dotenv'
import { createKotae } from './actions/kotae'
import { createOdai } from './actions/odai'

dotenv.config()

const app = new App({
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
})

app.message('こんにちは', async ({ message, say }) => {
  // NOTE: https://github.com/slackapi/bolt-js/issues/861
  if (!message.subtype) {
    await say(`:wave: こんにちは <@${message.user}>！`)
  }
})

createOdai(app)
createKotae(app)

const main = async () => {
  await app.start()
  console.log('⚡️ Bolt app started')
}

main()
