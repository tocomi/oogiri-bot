import { api } from '../api/axios'
import {
  OdaiFinishRequestParams,
  OdaiFinishResponse,
  OdaiGetCurrentRequestParams,
  OdaiGetCurrentResponse,
  OdaiPostRequestParams,
  OdaiPostResponse,
  OdaiStartVotingRequestParams,
  OdaiStartVotingResponse,
} from './Odai'

export class OdaiUseCase {
  async getCurrent(data: OdaiGetCurrentRequestParams) {
    const result = await api.get<OdaiGetCurrentResponse>('/odai/current', { params: data })
    return result.data
  }
  async create(data: OdaiPostRequestParams) {
    const result = await api.post<OdaiPostResponse>('/odai', data)
    return result.data
  }
  async startVoting(data: OdaiStartVotingRequestParams) {
    const result = await api.post<OdaiStartVotingResponse>('/odai/start-voting', data)
    return result.data
  }
  async finish(data: OdaiFinishRequestParams) {
    const result = await api.post<OdaiFinishResponse>('/odai/finish', data)
    return result.data
  }
}
