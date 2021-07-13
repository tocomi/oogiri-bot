import { OdaiRepository } from './OdaiRepository'
import {
  OdaiApiStatus,
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiPostRequestParams,
  OdaiPutApiStatus,
  OdaiPutStatusParams,
} from './Odai'

export interface OdaiService {
  create(params: OdaiPostRequestParams): Promise<OdaiApiStatus>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null>
  startVoting(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus>
  finish(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus>
}

export class OdaiServiceImpl implements OdaiService {
  repository: OdaiRepository

  constructor(repository: OdaiRepository) {
    this.repository = repository
  }

  create(params: OdaiPostRequestParams): Promise<OdaiApiStatus> {
    return this.repository.create(params)
  }

  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    return this.repository.getCurrent(params)
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
