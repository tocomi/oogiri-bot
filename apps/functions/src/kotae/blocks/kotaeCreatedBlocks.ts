import { KnownBlock } from '@slack/types'

export const kotaeCreatedBlocks: (kotae: string) => KnownBlock[] = (
  kotae: string,
) => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: ':white_check_mark: *回答の登録が完了しました！*',
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
