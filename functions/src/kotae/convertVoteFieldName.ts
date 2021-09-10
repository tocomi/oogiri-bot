import { Vote } from '../vote/Vote'

export const convertVoteFieldName = (
  voteRank: Vote['rank']
): 'votedFirstCount' | 'votedSecondCount' | 'votedThirdCount' => {
  if (voteRank === 1) return 'votedFirstCount'
  if (voteRank === 2) return 'votedSecondCount'
  return 'votedThirdCount'
}
