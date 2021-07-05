import { OdaiService } from '../odai/OdaiService'
import { KotaeApiStatus, KotaePostRequestParams } from './Kotae'
import { KotaeRepository } from './KotaeRepository'

export interface KotaeService {
  create(params: KotaePostRequestParams): Promise<KotaeApiStatus>
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
}
