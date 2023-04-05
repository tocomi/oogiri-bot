import { ApiPostStatus } from '../api/Api'
import { ApiError, hasError, InternalServerError, NoTargetKotaeError } from '../api/Error'
import { OdaiService } from '../odai/OdaiService'
import {
  KotaeByContentParams,
  KotaeByContentResponse,
  KotaeGetAllResponse,
  KotaeIncrementVoteCountParams,
  KotaeOfCurrentOdaiParams as KotaeOfCurrentOdaiParams,
  KotaePersonalResultParams,
  KotaePersonalResultResponse,
  KotaePostRequestParams,
  KotaeResultResponse,
} from './Kotae'
import { KotaeRepository } from './KotaeRepository'

export interface KotaeService {
  create(params: KotaePostRequestParams): Promise<ApiPostStatus>
  getAllOfCurrentOdai(params: KotaeOfCurrentOdaiParams): Promise<KotaeGetAllResponse>
  getPersonalResult(params: KotaePersonalResultParams): Promise<KotaePersonalResultResponse>
  getByContent(params: KotaeByContentParams): Promise<KotaeByContentResponse>
  incrementVoteCount(params: KotaeIncrementVoteCountParams): Promise<ApiPostStatus>
}

export class KotaeServiceImpl implements KotaeService {
  repository: KotaeRepository
  odaiService: OdaiService

  constructor(repository: KotaeRepository, odaiService: OdaiService) {
    this.repository = repository
    this.odaiService = odaiService
  }

  async create(params: KotaePostRequestParams): Promise<ApiPostStatus> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId: params.slackTeamId })
    if (hasError(currentOdai)) return currentOdai

    const result = await this.repository.create(params, currentOdai.docId)
    return result ? 'ok' : InternalServerError
  }

  async getAllOfCurrentOdai(
    params: KotaeOfCurrentOdaiParams
  ): Promise<KotaeGetAllResponse | ApiError> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId: params.slackTeamId })
    if (hasError(currentOdai)) return currentOdai

    // FIXME: 一旦ノーマルモードのみ対応
    if (currentOdai.type === 'ippon') throw InternalServerError

    const kotaeList = await this.repository.getAllOfCurrentOdai(params, currentOdai.docId)
    return {
      odaiTitle: currentOdai.title,
      odaiImageUrl: currentOdai.imageUrl,
      odaiDueDate: currentOdai.dueDate,
      odaiStatus: currentOdai.status,
      kotaeList,
    }
  }

  async getPersonalResult({
    slackTeamId,
    userId,
  }: KotaePersonalResultParams): Promise<KotaePersonalResultResponse | ApiError> {
    const recentFinishedOdai = await this.odaiService.getRecentFinished({
      slackTeamId,
    })
    if (hasError(recentFinishedOdai)) return recentFinishedOdai

    // FIXME: 一旦ノーマルモードのみ対応
    if (recentFinishedOdai.type === 'ippon') throw InternalServerError

    const kotaeList = await this.repository.getPersonalResult(
      { slackTeamId, userId },
      recentFinishedOdai.docId
    )

    // NOTE: 回答ごとに投票の情報を取得する
    const kotaeWithVoteList: KotaeResultResponse[] = []
    for (const kotae of kotaeList) {
      const votes = await this.repository.getVotedBy({
        slackTeamId,
        odaiDocId: recentFinishedOdai.docId,
        kotaeDocId: kotae.docId,
      })
      const kotaeWithVote = {
        ...kotae,
        votedByList: votes,
      }
      kotaeWithVoteList.push(kotaeWithVote)
    }

    return {
      odaiTitle: recentFinishedOdai.title,
      odaiDueDate: recentFinishedOdai.dueDate,
      odaiStatus: recentFinishedOdai.status,
      kotaeList: kotaeWithVoteList,
    }
  }

  async getByContent({
    slackTeamId,
    content,
  }: KotaeByContentParams): Promise<KotaeByContentResponse | ApiError> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId })
    if (hasError(currentOdai)) return currentOdai

    const kotae = await this.repository.getByContent({
      slackTeamId,
      content,
      odaiDocId: currentOdai.docId,
    })
    if (!kotae) return NoTargetKotaeError
    return kotae
  }

  async incrementVoteCount({
    slackTeamId,
    content,
    rank,
  }: KotaeIncrementVoteCountParams): Promise<ApiPostStatus> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId })
    if (hasError(currentOdai)) return currentOdai

    const kotae = await this.getByContent({ slackTeamId, content })
    if (hasError(kotae)) return kotae

    const result = await this.repository.incrementVoteCount({
      slackTeamId,
      odaiDocId: currentOdai.docId,
      kotaeDocId: kotae.docId,
      rank,
    })

    return result ? 'ok' : InternalServerError
  }
}
