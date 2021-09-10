import { VotePostRequestParams } from './Vote'

export const convertVoteRank = (
  voteRankText: 'first-rank-vote' | 'second-rank-vote' | 'third-rank-vote'
): VotePostRequestParams['rank'] => {
  if (voteRankText === 'first-rank-vote') {
    return 1
  }
  if (voteRankText === 'second-rank-vote') {
    return 2
  }
  return 3
}
