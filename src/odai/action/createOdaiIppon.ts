import { SlackShortcut, BlockAction, InteractiveMessage, WorkflowStepEdit } from '@slack/bolt'
import { WebClient, Logger } from '@slack/web-api'

// TODO: 共通化
export const CREATE_ODAI_IPPON_CALLBACK_ID = 'create-odai-ippon'
const TITLE_ACTION_ID = 'title'
const TITLE_BLOCK_ID = 'title-block'
export const IPPON_VOTE_COUNT_ACTION_ID = 'ippon-vote-count'
export const IPPON_VOTE_COUNT_BLOCK_ID = 'ippon-vote-count-block'
export const WIN_IPPON_COUNT_ACTION_ID = 'win-ippon-count'
export const WIN_IPPON_COUNT_BLOCK_ID = 'win-ippon-count-block'
const IMAGE_URL_ACTION_ID = 'image-url'
const IMAGE_URL_BLOCK_ID = 'image-url-block'

export const createIppon = async ({
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
        callback_id: CREATE_ODAI_IPPON_CALLBACK_ID,
        title: {
          type: 'plain_text',
          text: 'お題の設定(IPPON グランプリ)',
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
            block_id: IPPON_VOTE_COUNT_BLOCK_ID,
            element: {
              type: 'number_input',
              is_decimal_allowed: false,
              min_value: '2',
              max_value: '10',
              action_id: IPPON_VOTE_COUNT_ACTION_ID,
              placeholder: {
                type: 'plain_text',
                text: '2 - 10',
              },
            },
            label: {
              type: 'plain_text',
              text: 'IPPONに必要な投票数',
            },
          },
          {
            type: 'input',
            block_id: WIN_IPPON_COUNT_BLOCK_ID,
            element: {
              type: 'number_input',
              is_decimal_allowed: false,
              min_value: '1',
              max_value: '5',
              action_id: WIN_IPPON_COUNT_ACTION_ID,
              placeholder: {
                type: 'plain_text',
                text: '1 - 5',
              },
            },
            label: {
              type: 'plain_text',
              text: '優勝に必要なIPPON',
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
