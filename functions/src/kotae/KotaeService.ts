import { ApiPostStatus, SlackParams } from '../api/Api'
import { ApiError, hasError, InternalServerError, NoTargetKotaeError } from '../api/Error'
import { OdaiService } from '../odai/OdaiService'
import {
  KotaeByContentParams,
  KotaeByContentResponse,
  KotaeCountsRequest,
  KotaeCountsResponse,
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
  /** 回答の作成 */
  create(params: KotaePostRequestParams): Promise<ApiPostStatus>

  /** 現在アクティブなお題の全回答を取得 */
  getAllOfCurrentOdai(params: KotaeOfCurrentOdaiParams): Promise<KotaeGetAllResponse>

  /** 直近終了したお題の個人成績を取得 */
  getPersonalResult(params: KotaePersonalResultParams): Promise<KotaePersonalResultResponse>

  /** 回答内容をキーに情報を取得 */
  getByContent(params: KotaeByContentParams): Promise<KotaeByContentResponse>

  /** 投票数を加算する */
  incrementVoteCount(params: KotaeIncrementVoteCountParams): Promise<ApiPostStatus>

  /** 現在アクティブなお題の回答数と回答参加者数を取得 */
  getCurrentCounts(params: KotaeCountsRequest): Promise<KotaeCountsResponse>
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

    // NOTE: 同じ内容の答えがすでに存在する場合は何もしない
    const sameContentKotae = await this.repository.getByContent({
      slackTeamId: params.slackTeamId,
      content: params.content,
      odaiDocId: currentOdai.docId,
    })
    if (sameContentKotae) {
      console.warn('Same content kotae is posted.')
      return 'ok'
    }

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

  async getCurrentCounts(params: SlackParams): Promise<KotaeCountsResponse> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId: params.slackTeamId })
    if (hasError(currentOdai)) return currentOdai

    const kotaeList = await this.repository.getAllOfCurrentOdai(params, currentOdai.docId)

    return {
      kotaeCount: kotaeList.length,
      kotaeUserCount: [...new Set(kotaeList.map((k) => k.createdBy))].length,
    }
  }
}
