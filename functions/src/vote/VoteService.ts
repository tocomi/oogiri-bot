import { OdaiService } from '../odai/OdaiService'
import { VoteRequestParams, VoteApiStatus } from './Vote'
import { VoteRepository } from './VoteRepository'

export interface VoteService {
  create(params: VoteRequestParams): Promise<VoteApiStatus>
}

export class VoteServiceImpl implements VoteService {
  repository: VoteRepository
  odaiService: OdaiService

  constructor(repository: VoteRepository, odaiService: OdaiService) {
    this.repository = repository
    this.odaiService = odaiService
  }

  async create(params: VoteRequestParams): Promise<VoteApiStatus> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId: params.slackTeamId })
    if (!currentOdai) return 'noOdai'
    if (currentOdai.status !== 'voting') return 'noVotingOdai'
    return this.repository.create(params, currentOdai.docId)
  }
}
