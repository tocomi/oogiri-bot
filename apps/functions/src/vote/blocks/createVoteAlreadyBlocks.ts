import { KnownBlock } from '@slack/types'

import { medalEmoji } from '../util'
import { VoteRank } from '../Vote'

export const createVoteAlreadyBlocks = ({
  content,
  voteRank,
}: {
  content: string
  voteRank: VoteRank
}): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:warning: この答えには既に ${medalEmoji(voteRank)} で投票しています :warning: 回答: ${content}`,
    },
  },
]
