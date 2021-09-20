import { KnownBlock } from '@slack/types'
import { convertVoteRankText } from '../convertVoteValue'

export const createVoteAlreadySameRankBlocks = ({
  voteRank,
}: {
  voteRank: Parameters<typeof convertVoteRankText>[0]
}): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:warning: この投票は既に使用されています :warning: 種別: ${convertVoteRankText(
        voteRank
      )}`,
    },
  },
]
