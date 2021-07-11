import { api } from '../api/axios'
import { VotePostRequestParams, VotePostResponse } from './Vote'

export class VoteUseCase {
  async create(data: VotePostRequestParams) {
    const result = await api.post<VotePostResponse>('/kotae/vote', data)
    return result.data
  }
}
