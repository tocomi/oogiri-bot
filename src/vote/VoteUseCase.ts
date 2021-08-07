import { api } from '../api/axios'
import { VoteCount, VoteCountRequestParams, VotePostRequestParams, VotePostResponse } from './Vote'

export class VoteUseCase {
  async create(data: VotePostRequestParams) {
    const result = await api.post<VotePostResponse>('/kotae/vote', data)
    return result.data
  }

  async getVoteCount(data: VoteCountRequestParams): Promise<VoteCount> {
    const result = await api.get<VoteCount>('/vote/count', {
      params: data,
    })
    return result.data
  }
}
