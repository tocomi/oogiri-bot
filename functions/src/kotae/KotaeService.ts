import { OdaiService } from '../odai/OdaiService'
import {
  KotaeApiStatus,
  KotaeByContentParams,
  KotaeByContentResponse,
  KotaeGetAllResponse,
  KotaeIncrementVoteCountParams,
  KotaeOfCurrentOdaiParams as KotaeOfCurrentOdaiParams,
  KotaePersonalResultParams,
  KotaePersonalResultResponse,
  KotaePostRequestParams,
} from './Kotae'
import { KotaeRepository } from './KotaeRepository'

export interface KotaeService {
  create(params: KotaePostRequestParams): Promise<KotaeApiStatus>
  getAllOfCurrentOdai(params: KotaeOfCurrentOdaiParams): Promise<KotaeGetAllResponse | 'noOdai'>
  getPersonalResult(
    params: KotaePersonalResultParams
  ): Promise<KotaePersonalResultResponse | 'noOdai'>
  getByContent(params: KotaeByContentParams): Promise<KotaeByContentResponse | 'noOdai' | 'noKotae'>
  incrementVoteCount(params: KotaeIncrementVoteCountParams): Promise<boolean | 'noOdai' | 'noKotae'>
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
    params: KotaeOfCurrentOdaiParams
  ): Promise<KotaeGetAllResponse | 'noOdai'> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId: params.slackTeamId })
    if (!currentOdai) return 'noOdai'
    const kotaeList = await this.repository.getAllOfCurrentOdai(params, currentOdai.docId)
    return {
      odaiTitle: currentOdai.title,
      odaiDueDate: currentOdai.dueDate,
      odaiStatus: currentOdai.status,
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
      odaiDueDate: recentFinishedOdai.dueDate,
      odaiStatus: recentFinishedOdai.status,
      kotaeList,
    }
  }

  async getByContent({
    slackTeamId,
    content,
  }: KotaeByContentParams): Promise<KotaeByContentResponse | 'noOdai' | 'noKotae'> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId })
    if (!currentOdai) return 'noOdai'
    const kotae = await this.repository.getByContent({
      slackTeamId,
      content,
      odaiDocId: currentOdai.docId,
    })
    if (!kotae) return 'noKotae'
    return kotae
  }

  async incrementVoteCount({
    slackTeamId,
    content,
  }: KotaeIncrementVoteCountParams): Promise<boolean | 'noOdai' | 'noKotae'> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId })
    if (!currentOdai) return 'noOdai'

    const kotae = await this.getByContent({ slackTeamId, content })
    if (kotae === 'noKotae') return 'noKotae'
    if (kotae === 'noOdai') return 'noOdai'

    return this.repository.incrementVoteCount({
      slackTeamId,
      odaiDocId: currentOdai.docId,
      kotaeDocId: kotae.docId,
    })
  }
}
