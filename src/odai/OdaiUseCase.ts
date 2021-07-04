import { api } from '../api/axios'
import { OdaiPostRequestParams, OdaiPostResponse } from './Odai'

export class OdaiUseCase {
  async create(data: OdaiPostRequestParams) {
    const result = await api.post<OdaiPostResponse>('/odai', data)
    return result.data
  }
}
