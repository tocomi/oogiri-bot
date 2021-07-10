import { api } from '../api/axios'
import {
  OdaiPostRequestParams,
  OdaiPostResponse,
  OdaiStartVotingRequestParams,
  OdaiStartVotingResponse,
} from './Odai'

export class OdaiUseCase {
  async create(data: OdaiPostRequestParams) {
    const result = await api.post<OdaiPostResponse>('/odai', data)
    return result.data
  }
  async startVoting(data: OdaiStartVotingRequestParams) {
    const result = await api.post<OdaiStartVotingResponse>('/odai/start-voting', data)
    return result.data
  }
}
