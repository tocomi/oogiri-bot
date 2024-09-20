import { SlackShortcut, BlockAction, InteractiveMessage, WorkflowStepEdit } from '@slack/bolt'
import { WebClient, Logger } from '@slack/web-api'

export const START_VOTING_CALLBACK_ID = 'start-voting'

export const start = async ({
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
        callback_id: START_VOTING_CALLBACK_ID,
        title: {
          type: 'plain_text',
          text: '投票の開始 :ticket:',
        },
        submit: {
          type: 'plain_text',
          text: 'OK',
        },
        close: {
          type: 'plain_text',
          text: 'キャンセル',
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '投票を開始します。お題への回答は締め切られます。',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'よろしいですか？',
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
