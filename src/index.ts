import { App } from '@slack/bolt'
import * as dotenv from 'dotenv'

dotenv.config()

const app = new App({
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
})

// グローバルショートカット
app.shortcut('oogiri-shortcut', async ({ ack, body, client }) => {
  await ack()
  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'modal-id',
      title: {
        type: 'plain_text',
        text: 'タスク登録',
      },
      submit: {
        type: 'plain_text',
        text: '送信',
      },
      close: {
        type: 'plain_text',
        text: 'キャンセル',
      },
      blocks: [
        {
          type: 'input',
          block_id: 'input-task',
          element: {
            type: 'plain_text_input',
            action_id: 'input',
            multiline: true,
            placeholder: {
              type: 'plain_text',
              text: 'タスクの詳細・期限などを書いてください',
            },
          },
          label: {
            type: 'plain_text',
            text: 'タスク',
          },
        },
      ],
    },
  })
})

app.view('modal-id', async ({ ack, view, logger }) => {
  logger.info(`Submitted data: ${JSON.stringify(view.state.values)}`)
  await ack()
})

// イベント API
app.message('こんにちは', async ({ payload, say }) => {
  await say(`:wave: こんにちは <@${payload.channel}>！`)
})
;(async () => {
  await app.start()
  console.log('⚡️ Bolt app started')
})()
