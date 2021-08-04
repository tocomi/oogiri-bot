import { OdaiService } from '../odai/OdaiService'
import {
  KotaeApiStatus,
  KotaeGetAllResponse,
  KotaeOfCurrentOdaiParamas,
  KotaePersonalResultParams,
  KotaePersonalResultResponse,
  KotaePostRequestParams,
} from './Kotae'
import { KotaeRepository } from './KotaeRepository'

export interface KotaeService {
  create(params: KotaePostRequestParams): Promise<KotaeApiStatus>
  getAllOfCurrentOdai(params: KotaeOfCurrentOdaiParamas): Promise<KotaeGetAllResponse | 'noOdai'>
  getPersonalResult(
    params: KotaePersonalResultParams
  ): Promise<KotaePersonalResultResponse | 'noOdai'>
}

export class KotaeServiceImpl implements KotaeService {
  repository: KotaeRepository
  odaiService: OdaiService

  constructor(repository: KotaeRepository, odaiService: OdaiService) {
    this.repository = repository
    this.odaiService = odaiService
  }

  async create(params: KotaePostRequestParams): Promise<KotaeApiStatus> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId: params.slackTeamId })
    if (!currentOdai) return 'noOdai'
    return this.repository.create(params, currentOdai.docId)
  }

  async getAllOfCurrentOdai(
    params: KotaeOfCurrentOdaiParamas
  ): Promise<KotaeGetAllResponse | 'noOdai'> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId: params.slackTeamId })
    if (!currentOdai) return 'noOdai'
    const kotaeList = await this.repository.getAllOfCurrentOdai(params, currentOdai.docId)
    return {
      odaiTitle: currentOdai.title,
      kotaeList,
    }
  }

  async getPersonalResult(
    params: KotaePersonalResultParams
  ): Promise<KotaePersonalResultResponse | 'noOdai'> {
    const recentFinishedOdai = await this.odaiService.getRecentFinished({
      slackTeamId: params.slackTeamId,
    })
    if (!recentFinishedOdai) return 'noOdai'
    const kotaeList = await this.repository.getPersonalResult(params, recentFinishedOdai.docId)
    return {
      odaiTitle: recentFinishedOdai.title,
      kotaeList,
    }
  }
}
