import { ViewsOpenArguments } from '@slack/web-api'

export const KOTAE_CREATE_CALLBACK_ID = 'create-kotae'
export const KOTAE_CREATE_BLOCK_ID = 'create-kotae-block'
export const KOTAE_CREATE_ACTION_ID = 'input'

export const kotaeCreateView: (triggerId: string) => ViewsOpenArguments = (triggerId: string) => ({
  trigger_id: triggerId,
  view: {
    type: 'modal',
    callback_id: KOTAE_CREATE_CALLBACK_ID,
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
        block_id: KOTAE_CREATE_BLOCK_ID,
        element: {
          type: 'plain_text_input',
          action_id: KOTAE_CREATE_ACTION_ID,
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
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '誰かを不快にさせうる回答は控えましょう:relieved:',
        },
      },
    ],
  },
})
