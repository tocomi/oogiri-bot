import { App } from '@slack/bolt'
import { OdaiUseCase } from './OdaiUseCase'

const CALLBACK_ID = 'create-odai'
const BLOCK_ID = 'create-odai-block'
const ACTION_ID = 'input'

export const createOdai = (app: App) => {
  app.shortcut('oogiri-create-odai', async ({ ack, body, client, logger }) => {
    const result = await client.views
      .open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: CALLBACK_ID,
          title: {
            type: 'plain_text',
            text: 'お題の設定',
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
                  text: '例: こんな結婚式は嫌だ',
                },
              },
              label: {
                type: 'plain_text',
                text: 'お題',
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
    const newOdai = view.state.values[BLOCK_ID][ACTION_ID].value
    // NOTE: 型の絞り込みのため。slack側で必須入力になっている。
    if (!newOdai) return

    const odaiUseCase = new OdaiUseCase()
    const success = await odaiUseCase
      .create({
        slackTeamId: view.team_id,
        title: newOdai,
        createdBy: body.user.id,
      })
      .then(() => true)
      .catch((error) => {
        logger.error(error)
        return false
      })
    await ack()
    if (!success) return

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<!here> 新しいお題が設定されました！`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:speech_balloon: *お題: ${newOdai}*`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'お題に回答するには入力欄左の :zap: マークから *お題に回答する* を選んでください！',
        },
      },
    ]
    await client.chat.postMessage({
      channel: 'C026ZJX56AC',
      blocks,
    })
  })
}
