import { App } from '@slack/bolt'

import { config } from './config'
import { createServices } from './createServices'
import { getActionLabel } from './slack/getActionLabel'
import { registerHandlers } from './slack/handlers/registerHandlers'

// NOTE: 開発専用のエントリポイント (pnpm dev:socket)
// Socket Mode でローカルから Slack に接続するため、公開 URL もエミュレータも要らない
// 本番は index.ts (HTTP Mode) のまま。REST API と定期実行はここでは動かさない

if (!config.slack.botToken || !config.slack.appToken) {
  console.error(
    'SLACK_BOT_TOKEN と SLACK_APP_TOKEN を .env.local に設定してください',
  )
  process.exit(1)
}

const app = new App({
  token: config.slack.botToken,
  appToken: config.slack.appToken,
  socketMode: true,
})

app.use(async ({ body, next }) => {
  console.log(
    `[slack] triggered: ${getActionLabel(body as Record<string, unknown>)}`,
  )
  await next()
})

registerHandlers({ app, ...createServices() })

const main = async () => {
  await app.start()
  console.log('⚡️ Socket Mode で起動しました')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
