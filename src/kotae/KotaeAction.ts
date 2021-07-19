import { App, KnownBlock } from '@slack/bolt'
import { postEphemeral, postInternalErrorMessage } from '../message/postMessage'
import { KotaeUseCase } from './KotaeUseCase'

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
    if (!kotae) return

    await ack()
    const kotaeUseCase = new KotaeUseCase()
    const success = await kotaeUseCase
      .create({
        slackTeamId: view.team_id,
        content: kotae,
        createdBy: body.user.id,
      })
      .then(() => true)
      .catch((error) => {
        logger.error(error)
        if (error.response.data.message === 'No Active Odai') {
          const blocks: KnownBlock[] = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':warning: お題が開始されていません :warning:',
              },
            },
          ]
          postEphemeral({ client, user: body.user.id, blocks })
        } else {
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return false
      })
    if (!success) return

    const blocks: KnownBlock[] = [
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
    await postEphemeral({
      client,
      user: body.user.id,
      blocks,
    })
  })
}
