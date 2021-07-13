import { api } from '../api/axios'
import { KotaePostRequestParams, KotaePostResponse } from './Kotae'

export class KotaeUseCase {
  async create(data: KotaePostRequestParams) {
    const result = await api.post<KotaePostResponse>('/kotae', data)
    return result.data
  }
}
