import { KnownBlock } from '@slack/types'

export const createOdaiDuplicationBlocks = (): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: ':warning: 他のお題がオープンしています :warning:',
    },
  },
]
