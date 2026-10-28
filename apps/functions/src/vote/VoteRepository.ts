import {
  MyVote,
  MyVotesOfOdaiParams,
  Vote,
  VoteCountByUserParams,
  VoteOfCurrentOdaiParams,
  VoteCreateRequest,
  VoteOfCurrentOdaiResponse,
  VoteRankChange,
} from './Vote'

export type VoteSaveParams = VoteCreateRequest & {
  odaiId: string
  kotaeId: string
  kotaeCreatedBy: string
  // NOTE: 指定時は新規作成せず、この票の賞を付け替える
  currentVoteId?: string
  demotedVotes: VoteRankChange[]
}

export interface VoteRepository {
  getMyVotesOfOdai(params: MyVotesOfOdaiParams): Promise<MyVote[]>
  save(params: VoteSaveParams): Promise<Vote>
  getAllOfCurrentOdai(
    params: VoteOfCurrentOdaiParams,
    odaiId: string,
  ): Promise<VoteOfCurrentOdaiResponse>
  getAllByUser(params: VoteCountByUserParams): Promise<Vote[]>
}
