import { VotePostRequestParams } from './Vote'

export const convertVoteRank = (
  voteRankText: 'first-rank-vote' | 'second-rank-vote' | 'third-rank-vote'
): VotePostRequestParams['rank'] => {
  if (voteRankText === 'first-rank-vote') return 1
  if (voteRankText === 'second-rank-vote') return 2
  return 3
}

export const convertVoteRankText = (rank: VotePostRequestParams['rank']): string => {
  if (rank === 1) return 'サバンナの大地'
  if (rank === 2) return '大草原'
  return '草'
}
