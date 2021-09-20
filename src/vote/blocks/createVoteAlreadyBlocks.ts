import { KnownBlock } from '@slack/types'

export const createVoteAlreadyBlocks = ({ content }: { content: string }): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:warning: この答えは既に投票されています :warning: 回答: ${content}`,
    },
  },
]
