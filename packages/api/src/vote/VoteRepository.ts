import {
  Vote,
  VoteCountByUserParams,
  VoteOfCurrentOdaiParams,
  VoteCreateRequest,
  VoteCheckDuplicationParams,
  VoteOfCurrentOdaiResponse,
} from './Vote'

export interface VoteRepository {
  checkDuplication(
    params: VoteCheckDuplicationParams
  ): Promise<'ok' | 'alreadyVoted' | 'alreadySameRankVoted'>
  create(
    params: VoteCreateRequest & {
      odaiId: string
      kotaeId: string
      kotaeCreatedBy: string
    }
  ): Promise<Vote>
  getAllOfCurrentOdai(
    params: VoteOfCurrentOdaiParams,
    odaiId: string
  ): Promise<VoteOfCurrentOdaiResponse>
  getAllByUser(params: VoteCountByUserParams): Promise<Vote[]>
}
