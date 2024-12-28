import { SlackShortcut, BlockAction, InteractiveMessage, WorkflowStepEdit } from '@slack/bolt'
import { WebClient, Logger } from '@slack/web-api'

export const FINISH_ODAI_CALLBACK_ID = 'finish'

export const finish = async ({
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
        callback_id: FINISH_ODAI_CALLBACK_ID,
        title: {
          type: 'plain_text',
          text: '結果発表 :mega:',
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
              text: '結果発表をします。回答への投票は締め切られます。',
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
