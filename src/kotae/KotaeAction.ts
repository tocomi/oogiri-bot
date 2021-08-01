import {
  App,
  BlockAction,
  InteractiveMessage,
  KnownBlock,
  SlackShortcut,
  WorkflowStepEdit,
} from '@slack/bolt'
import { Logger, WebClient } from '@slack/web-api'
import { postEphemeral, postInternalErrorMessage, postMessage } from '../message/postMessage'
import { KotaeUseCase } from './KotaeUseCase'

const CALLBACK_ID = 'create-kotae'
const BLOCK_ID = 'create-kotae-block'
const ACTION_ID = 'input'

const create = async ({
  body,
  client,
  logger,
}: {
  body: SlackShortcut | BlockAction | InteractiveMessage | WorkflowStepEdit
  client: WebClient
  logger: Logger
}) => {
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
}

export const createKotae = (app: App) => {
  // NOTE: ショートカットからの回答
  app.shortcut('oogiri-create-kotae', async ({ ack, body, client, logger }) => {
    await create({ body, client, logger })
    await ack()
  })
  // NOTE: ボタンからの回答
  app.action('oogiri-create-kotae', async ({ ack, body, client, logger }) => {
    if ('trigger_id' in body) {
      await create({ body, client, logger })
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
        if (error.response.data.message === 'No Active Odai') {
          logger.warn(error.response.data.message)
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
          logger.error(error.response.config)
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

export const countKotae = (app: App) => {
  app.command('/oogiri-count-kotae', async ({ ack, body, client, logger }) => {
    await ack()
    const kotaeUseCase = new KotaeUseCase()
    const result = await kotaeUseCase
      .getKotaeCount({ slackTeamId: body.team_id })
      .catch((error) => {
        if (error.response.data.message === 'No Active Odai') {
          logger.warn(error.response.data.message)
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
          logger.error(error.response.config)
          postInternalErrorMessage({ client, user: body.user.id })
        }
        return undefined
      })
    if (!result) return
    const blocks: KnownBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':mega: *現在の回答状況* :mega:',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:speech_balloon: お題: ${result.odaiTitle}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:speaking_head_in_silhouette: *回答数: ${result.kotaeCount}*`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'お題に回答する',
            },
            style: 'primary',
            action_id: 'oogiri-create-kotae',
          },
        ],
      },
    ]
    await postMessage({ client, blocks })
  })
}
