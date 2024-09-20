import {
  VoteCount,
  VoteCountRequestParams,
  VotePostRequestParams,
  VotePostResponse,
  VoteResultRequestParams,
  VoteResultResponse,
} from './Vote'
import { api } from '../api/axios'

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

  async getVoteResult(data: VoteResultRequestParams): Promise<VoteResultResponse> {
    const result = await api.get<VoteResultResponse>('/vote/my-fans', {
      params: data,
    })
    return result.data
  }
}
