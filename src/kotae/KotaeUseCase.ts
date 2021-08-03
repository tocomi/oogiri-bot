import { api } from '../api/axios'
import {
  KotaeCount,
  KotaeListRequestParams,
  KotaeListResponse,
  KotaePostRequestParams,
  KotaePostResponse,
} from './Kotae'

export class KotaeUseCase {
  async create(data: KotaePostRequestParams) {
    const result = await api.post<KotaePostResponse>('/kotae', data)
    return result.data
  }

  async getAllOfCurrentOdai(data: KotaeListRequestParams) {
    const result = await api.get<KotaeListResponse>('/kotae/current', {
      params: data,
    })
    return result.data
  }

  async getKotaeCount(data: KotaeListRequestParams): Promise<KotaeCount> {
    const result = await this.getAllOfCurrentOdai(data)
    return {
      odaiTitle: result.odaiTitle,
      uniqueUserCount: [...new Set(result.kotaeList.map((k) => k.createdBy))].length,
      kotaeCount: result.kotaeList.length,
    }
  }
}
