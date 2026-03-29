import { KnownBlock } from '@slack/types'

export const createOdaiNothingBlocks = (): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: ':warning: 投票受付中のお題がありません :warning:',
    },
  },
]
