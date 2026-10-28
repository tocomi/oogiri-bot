import { KnownBlock } from '@slack/types'

import { medalEmoji } from '../util'
import { VoteRank, VoteRankChange } from '../Vote'

export const createVoteCompleteBlocks = ({
  content,
  voteRank,
  previousRank,
  demotedVotes,
}: {
  content: string
  voteRank: VoteRank
  previousRank?: VoteRank
  demotedVotes: VoteRankChange[]
}): KnownBlock[] => {
  const lines = [
    previousRank
      ? `:white_check_mark: *投票の変更が完了しました！* 回答: ${content} 投票: ${medalEmoji(
          previousRank,
        )} → ${medalEmoji(voteRank)}`
      : `:white_check_mark: *投票の登録が完了しました！* 回答: ${content} 投票: ${medalEmoji(
          voteRank,
        )}`,
    ...demotedVotes.map(
      (demoted) =>
        `:arrow_down: 回答: ${demoted.kotaeContent} 投票: ${medalEmoji(
          demoted.from,
        )} → ${medalEmoji(demoted.to)}`,
    ),
  ]
  // NOTE: section の text は 3,000 文字までなので、長い回答が並んでも超えないよう 1 件ずつ分ける
  return lines.map((text) => ({
    type: 'section',
    text: { type: 'mrkdwn', text },
  }))
}
