import { OdaiRepository } from './OdaiRepository'
import {
  OdaiApiStatus,
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiPostRequestParams,
  OdaiPutApiStatus,
  OdaiPutStatusParams,
  OdaiRecentFinishedParams,
  OdaiRecentFinishedResponse,
} from './Odai'

export interface OdaiService {
  create(params: OdaiPostRequestParams): Promise<OdaiApiStatus>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null>
  getRecentFinished(params: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse | null>
  startVoting(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus>
  finish(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus>
}

export class OdaiServiceImpl implements OdaiService {
  repository: OdaiRepository

  constructor(repository: OdaiRepository) {
    this.repository = repository
  }

  async create(params: OdaiPostRequestParams): Promise<OdaiApiStatus> {
    const currentOdai = await this.getCurrent({ slackTeamId: params.slackTeamId })
    if (currentOdai) return 'duplication'
    return this.repository.create(params)
  }

  async getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    return this.repository.getCurrent(params)
  }

  async getRecentFinished(
    params: OdaiRecentFinishedParams
  ): Promise<OdaiRecentFinishedResponse | null> {
    return this.repository.getRecentFinished(params)
  }

  async startVoting(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus> {
    const currentOdai = await this.getCurrent({ slackTeamId: params.slackTeamId })
    if (!currentOdai) return 'noOdai'
    if (currentOdai.status !== 'posting') return 'noPostingOdai'
    return this.repository.updateStatus(
      { slackTeamId: params.slackTeamId, status: 'voting' },
      currentOdai.docId
    )
  }

  async finish(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus> {
    const currentOdai = await this.getCurrent({ slackTeamId: params.slackTeamId })
    if (!currentOdai) return 'noOdai'
    if (currentOdai.status !== 'voting') return 'noVotingOdai'
    return this.repository.updateStatus(
      { slackTeamId: params.slackTeamId, status: 'finished' },
      currentOdai.docId
    )
  }
}
