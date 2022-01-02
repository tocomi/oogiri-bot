import { api } from '../api/axios'
import {
  KotaeCount,
  KotaeListRequestParams,
  KotaeListResponse,
  KotaePersonalResultParams,
  KotaePersonalResultResponse,
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
      odaiImageUrl: result.odaiImageUrl,
      odaiDueDate: result.odaiDueDate,
      odaiStatus: result.odaiStatus,
      uniqueUserCount: [...new Set(result.kotaeList.map((k) => k.createdBy))].length,
      kotaeCount: result.kotaeList.length,
    }
  }

  async getPersonalResult(data: KotaePersonalResultParams): Promise<KotaePersonalResultResponse> {
    const result = await api.get<KotaePersonalResultResponse>('/kotae/personal-result', {
      params: data,
    })
    return result.data
  }
}
