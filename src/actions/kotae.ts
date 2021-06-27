import { App } from '@slack/bolt'

const CALLBACK_ID = 'create-kotae'
const BLOCK_ID = 'create-kotae-block'
const ACTION_ID = 'input'

export const createKotae = (app: App) => {
  app.shortcut('oogiri-create-kotae', async ({ ack, body, client, logger }) => {
    const result = await client.views
      .open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: CALLBACK_ID,
          title: {
            type: 'plain_text',
            text: 'お題への回答',
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
              block_id: BLOCK_ID,
              element: {
                type: 'plain_text_input',
                action_id: ACTION_ID,
                placeholder: {
                  type: 'plain_text',
                  text: '例: 〇〇が□□だ',
                },
              },
              label: {
                type: 'plain_text',
                text: '答え',
              },
            },
          ],
        },
      })
      .catch(async (e) => {
        logger.error(e)
      })
    if (result && result.error) {
      logger.error(result.error)
    }
    await ack()
  })

  app.view(CALLBACK_ID, async ({ ack, view, client, body, logger }) => {
    const kotae = view.state.values[BLOCK_ID][ACTION_ID].value
    logger.info(`kotae: ${kotae}`)
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*回答が投稿されました* :tada:`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `あなたの回答: ${kotae}`,
        },
      },
    ]
    await client.chat.postMessage({
      channel: body.user.id,
      blocks,
    })
    await ack()
  })
}
