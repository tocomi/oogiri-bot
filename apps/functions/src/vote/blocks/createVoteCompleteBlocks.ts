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
      text: `:white_check_mark: *投票の登録が完了しました！* 回答: ${content} 投票: ${convertVoteRankText(
        voteRank,
      )}`,
    },
  },
]
