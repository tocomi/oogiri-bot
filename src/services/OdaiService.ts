import { api } from '../axios'
import { OdaiPostRequestParams, OdaiPostResponse } from '../types/Odai'

export class OdaiService {
  async create(data: OdaiPostRequestParams) {
    const result = await api.post<OdaiPostResponse>('/odai', data)
    return result.data
  }
}
