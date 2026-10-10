import { KnownBlock } from '@slack/types'

export const kotaeCreatedBlocks: (kotae: string) => KnownBlock[] = (
  kotae: string,
) => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*回答を受け付けました！* :tada:`,
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
