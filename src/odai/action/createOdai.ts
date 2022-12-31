import { SlackShortcut, BlockAction, InteractiveMessage, WorkflowStepEdit } from '@slack/bolt'
import { WebClient, Logger } from '@slack/web-api'

export const CREATE_ODAI_CALLBACK_ID = 'create-odai'
export const TITLE_ACTION_ID = 'title'
export const TITLE_BLOCK_ID = 'title-block'
export const DUE_DATE_ACTION_ID = 'due-date'
export const DUE_DATE_BLOCK_ID = 'due-date-block'
export const IMAGE_URL_ACTION_ID = 'image-url'
export const IMAGE_URL_BLOCK_ID = 'image-url-block'

export const create = async ({
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
        callback_id: CREATE_ODAI_CALLBACK_ID,
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
            block_id: TITLE_BLOCK_ID,
            element: {
              type: 'plain_text_input',
              action_id: TITLE_ACTION_ID,
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
          {
            type: 'input',
            block_id: DUE_DATE_BLOCK_ID,
            element: {
              type: 'datepicker',
              action_id: DUE_DATE_ACTION_ID,
              placeholder: {
                type: 'plain_text',
                text: 'いつまで回答を受け付けますか？',
              },
            },
            label: {
              type: 'plain_text',
              text: '回答期限 (目安。自動的に回答が締め切られることはありません)',
            },
          },
          {
            type: 'input',
            block_id: IMAGE_URL_BLOCK_ID,
            optional: true,
            element: {
              type: 'plain_text_input',
              action_id: IMAGE_URL_ACTION_ID,
              placeholder: {
                type: 'plain_text',
                text: 'https://img.yakkun.com/poke/icon960/n110.png',
              },
            },
            label: {
              type: 'plain_text',
              text: '画像URL (画像系のお題のみ)',
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
