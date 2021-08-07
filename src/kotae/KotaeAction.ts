import dayjs from 'dayjs'
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
    await ack()
    await create({ body, client, logger })
  })
  // NOTE: ボタンからの回答
  app.action('oogiri-create-kotae', async ({ ack, body, client, logger }) => {
    await ack()
    if ('trigger_id' in body) {
      await create({ body, client, logger })
    }
  })

  app.view(CALLBACK_ID, async ({ ack, view, client, body, logger }) => {
    await ack()
    const kotae = view.state.values[BLOCK_ID][ACTION_ID].value
    if (!kotae) return

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
          text: `:ninja: *参加者: ${result.uniqueUserCount}人*  :speaking_head_in_silhouette: *回答数: ${result.kotaeCount}*`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:calendar: 回答期限: ${dayjs(result.odaiDueDate).format('YYYY/MM/DD')}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'お題に回答する (複数回答可)',
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

export const checkResult = (app: App) => {
  app.command('/oogiri-check-my-result', async ({ ack, body, client, logger }) => {
    await ack()
    const kotaeUseCase = new KotaeUseCase()
    const result = await kotaeUseCase
      .getPersonalResult({ slackTeamId: body.team_id, userId: body.user_id })
      .catch((error) => {
        if (error.response.data.message === 'No Finished Odai') {
          logger.warn(error.response.data.message)
          const blocks: KnownBlock[] = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':warning: 結果を表示するお題がありません :warning:',
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
    if (!result || !result.kotaeList.length) return
    const headerBlocks: KnownBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:bar_chart: :bar_chart: :bar_chart: *直近のあなたの回答結果* :bar_chart: :bar_chart: :bar_chart:`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:speech_balloon: *お題: ${result.odaiTitle}*`,
        },
      },
    ]
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const resultBlocks: KnownBlock[] = result.kotaeList
      .map((kotae) => {
        return [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:point_up: *投票数: ${kotae.votedCount}* - ${kotae.content}`,
            },
          },
        ]
      })
      .flat()
    const blocks = [...headerBlocks, ...resultBlocks]
    await postEphemeral({ client, user: body.user_id, blocks })
  })
}
