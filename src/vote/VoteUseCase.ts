import { api } from '../api/axios'
import { KotaeUseCase } from '../kotae/KotaeUseCase'
import { VoteCount, VoteCountRequestParams, VotePostRequestParams, VotePostResponse } from './Vote'

export class VoteUseCase {
  async create(data: VotePostRequestParams) {
    const result = await api.post<VotePostResponse>('/kotae/vote', data)
    return result.data
  }

  async getVoteCount(data: VoteCountRequestParams): Promise<VoteCount> {
    const kotaeUseCase = new KotaeUseCase()
    const result = await kotaeUseCase.getAllOfCurrentOdai(data)
    return {
      odaiTitle: result.odaiTitle,
      uniqueUserCount: [...new Set(result.kotaeList.map((k) => k.createdBy))].length,
      voteCount: result.kotaeList.reduce((totalCount, { votedCount }) => {
        return totalCount + votedCount
      }, 0),
    }
  }
}
