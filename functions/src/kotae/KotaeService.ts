import { OdaiService } from '../odai/OdaiService'
import {
  KotaeApiStatus,
  KotaeOfCurrentOdaiParamas,
  KotaePostRequestParams,
  KotaeResponse,
} from './Kotae'
import { KotaeRepository } from './KotaeRepository'

export interface KotaeService {
  create(params: KotaePostRequestParams): Promise<KotaeApiStatus>
  getAllOfCurrentOdai(params: KotaeOfCurrentOdaiParamas): Promise<KotaeResponse[] | 'noOdai'>
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
  ): Promise<KotaeResponse[] | 'noOdai'> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId: params.slackTeamId })
    if (!currentOdai) return 'noOdai'
    return this.repository.getAllOfCurrentOdai(params, currentOdai.docId)
  }
}
