import { KnownBlock } from '@slack/bolt'

export const VOTE_KOTAE_IPPON_ACTION_ID = 'vote-kotae-ippon'

export const kotaeIpponCreatedBlocks: (kotae: string) => KnownBlock[] = (kotae: string) => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `👇 回答が投稿されました！\n*${kotae}*`,
    },
    accessory: {
      type: 'button',
      action_id: VOTE_KOTAE_IPPON_ACTION_ID,
      text: {
        type: 'plain_text',
        text: '草',
      },
    },
  },
]
