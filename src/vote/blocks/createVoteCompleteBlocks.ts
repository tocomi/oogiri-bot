import { KnownBlock } from '@slack/types'
import { convertVoteRankText } from '../convertVoteValue'

export const createVoteCompleteBlocks = ({
  content,
  voteRank,
}: {
  content: string
  voteRank: Parameters<typeof convertVoteRankText>[0]
}): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:point_up: 投票を受け付けました！ 回答: ${content} 投票: ${convertVoteRankText(
        voteRank
      )}`,
    },
  },
]
