import { OdaiRepository } from './OdaiRepository'
import {
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiPostRequestParams,
  OdaiPutApiStatus,
  OdaiPutStatusParams,
  OdaiRecentFinishedParams,
  OdaiRecentFinishedResponse,
} from './Odai'
import { ApiPostStatus } from '../api/Api'
import {
  hasError,
  InternalServerError,
  NoActiveOdaiError,
  NoFinishedOdaiError,
  NoPostingOdaiError,
  NoVotingOdaiError,
  OdaiDuplicationError,
} from '../api/Error'

export interface OdaiService {
  create(params: OdaiPostRequestParams): Promise<ApiPostStatus>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse>
  getRecentFinished(params: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse>
  startVoting(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus>
  finish(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus>
}

export class OdaiServiceImpl implements OdaiService {
  repository: OdaiRepository

  constructor(repository: OdaiRepository) {
    this.repository = repository
  }

  async create(params: OdaiPostRequestParams): Promise<ApiPostStatus> {
    const currentOdai = await this.repository.getCurrent(params)
    if (currentOdai) return OdaiDuplicationError

    const result = await this.repository.create(params)
    return result ? 'ok' : InternalServerError
  }

  async getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse> {
    const currentOdai = await this.repository.getCurrent(params)
    if (!currentOdai) return NoActiveOdaiError

    return currentOdai
  }

  async getRecentFinished(params: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse> {
    const recentFinishedOdai = await this.repository.getRecentFinished(params)
    if (!recentFinishedOdai) return NoFinishedOdaiError

    return recentFinishedOdai
  }

  async startVoting(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus> {
    const currentOdai = await this.getCurrent({ slackTeamId: params.slackTeamId })
    if (hasError(currentOdai)) return currentOdai
    if (currentOdai.status !== 'posting') return NoPostingOdaiError

    const result = await this.repository.updateStatus(
      { slackTeamId: params.slackTeamId, status: 'voting' },
      currentOdai.docId
    )
    return result ? 'ok' : InternalServerError
  }

  async finish(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus> {
    const currentOdai = await this.getCurrent({ slackTeamId: params.slackTeamId })
    if (hasError(currentOdai)) return currentOdai
    if (currentOdai.status !== 'voting') return NoVotingOdaiError

    const result = await this.repository.updateStatus(
      { slackTeamId: params.slackTeamId, status: 'finished' },
      currentOdai.docId
    )
    return result ? 'ok' : InternalServerError
  }
}
