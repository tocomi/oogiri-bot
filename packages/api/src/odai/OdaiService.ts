import {
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiFinishParams,
  OdaiFinishResponse,
  OdaiFinishedListParams,
  OdaiFinishedListResponse,
  OdaiGetAllResultsParams,
  OdaiGetResultParams,
  OdaiPostRequestParams,
  OdaiPutApiStatus,
  OdaiPutStatusParams,
  OdaiRecentFinishedParams,
  OdaiRecentFinishedResponse,
  OdaiResult,
  OdaiWithResult,
  OdaiWithResultSummary,
} from './Odai'
import { OdaiRepository } from './OdaiRepository'
import { generateCommentary } from '../ai/generateCommentary'
import { ApiPostStatus } from '../api/Api'
import {
  ApiError,
  hasError,
  InternalServerError,
  NoActiveOdaiError,
  NoFinishedOdaiError,
  NoPostingOdaiError,
  NoVotingOdaiError,
  OdaiDuplicationError,
} from '../api/Error'
import { Kotae } from '../kotae/Kotae'
import { makePointRanking } from '../kotae/rank/makePointRanking'
import { makeVotedCountRanking } from '../kotae/rank/makeVotedCountRanking'
import { getUserNameMapFromUserId } from '../slack/getUserNameFromUserId'
import { generateId } from '../util/generateId'

export interface OdaiService {
  create(params: OdaiPostRequestParams): Promise<ApiPostStatus>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse>
  getRecentFinished(params: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse>
  getRecent5timesFinished(params: OdaiFinishedListParams): Promise<OdaiFinishedListResponse>
  startVoting(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus>

  /** お題の完了。ステータスの更新と結果データの登録を行う。 */
  finish(params: OdaiFinishParams): Promise<OdaiFinishResponse>

  /** 過去のお題の結果のサマリをすべて取得する。詳細な回答内容は含めない */
  getAllResults(params: OdaiGetAllResultsParams): Promise<OdaiWithResultSummary[]>

  /** 特定のお題の結果を取得する。詳細な回答内容も含まれる */
  getResult(params: OdaiGetResultParams): Promise<OdaiWithResult | ApiError>
}

export class OdaiServiceImpl implements OdaiService {
  repository: OdaiRepository
  newRepository: OdaiRepository

  constructor(repository: OdaiRepository, newRepository: OdaiRepository) {
    this.repository = repository
    this.newRepository = newRepository
  }

  async create(params: OdaiPostRequestParams): Promise<ApiPostStatus> {
    const currentOdai = await this.repository.getCurrent(params)
    if (currentOdai) return OdaiDuplicationError

    if (params.type === 'normal') {
      const id = generateId()
      const [resultA, resultB] = await Promise.all([
        this.repository.createNormal({ ...params, id }),
        this.newRepository.createNormal({ ...params, id }),
      ])
      if (!resultA || !resultB) return InternalServerError
    } else {
      const [resultA, resultB] = await Promise.all([
        this.repository.createIppon(params),
        this.newRepository.createIppon(params),
      ])
      if (!resultA || !resultB) return InternalServerError
    }
    return 'ok'
  }

  async getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse> {
    const currentOdai = await this.newRepository.getCurrent(params)
    if (!currentOdai) return NoActiveOdaiError

    return currentOdai
  }

  async getRecentFinished(params: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse> {
    const finishedOdaiList = await this.repository.getAllFinished(params)
    if (!finishedOdaiList.length) return NoFinishedOdaiError

    return finishedOdaiList[0]
  }

  async getRecent5timesFinished(params: OdaiFinishedListParams): Promise<OdaiFinishedListResponse> {
    const finishedOdaiList = await this.repository.getAllFinished(params)
    if (!finishedOdaiList.length) return NoFinishedOdaiError

    return finishedOdaiList.slice(0, 5)
  }

  async startVoting(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus> {
    const currentOdai = await this.getCurrent({ slackTeamId: params.slackTeamId })
    if (hasError(currentOdai)) return currentOdai
    if (currentOdai.status !== 'posting') return NoPostingOdaiError

    const [resultA, resultB] = await Promise.all([
      this.repository.updateStatus(
        { slackTeamId: params.slackTeamId, status: 'voting' },
        currentOdai.id
      ),
      this.newRepository.updateStatus(
        { slackTeamId: params.slackTeamId, status: 'voting' },
        currentOdai.id
      ),
    ])
    return resultA && resultB ? 'ok' : InternalServerError
  }

  async finish({ slackTeamId, kotaeList }: OdaiFinishParams): Promise<OdaiFinishResponse> {
    const currentOdai = await this.getCurrent({ slackTeamId })
    if (hasError(currentOdai)) return currentOdai
    if (currentOdai.type === 'normal' && currentOdai.status !== 'voting') return NoVotingOdaiError

    // NOTE: お題の結果を result フィールドに格納する
    // TODO: トランザクション管理できてない
    const odaiResult = this.makeOdaiResult({ odaiId: currentOdai.id, kotaeList })
    const [result1, result2] = await Promise.all([
      this.repository.createResult({ slackTeamId, odaiResult }),
      this.newRepository.createResult({ slackTeamId, odaiResult }),
    ])
    if (!result1 || !result2) return InternalServerError

    let aiCommentary: string | undefined
    try {
      aiCommentary = await generateCommentary({
        odaiTitle: currentOdai.title,
        kotaeList,
        pointStats: odaiResult.pointStats,
        countStats: odaiResult.countStats,
      })
    } catch (error) {
      console.error('AI講評の生成に失敗しました', error)
      // エラー時は講評なしで続行
    }

    const [resultA, resultB] = await Promise.all([
      this.repository.updateStatus({ slackTeamId, status: 'finished' }, currentOdai.id),
      this.newRepository.updateStatus({ slackTeamId, status: 'finished' }, currentOdai.id),
    ])
    return resultA && resultB ? { aiCommentary: aiCommentary ?? '' } : InternalServerError
  }

  async getAllResults(params: OdaiGetAllResultsParams): Promise<OdaiWithResultSummary[]> {
    const result = await this.repository.getAllResults(params)
    return result
      .map((odai) => ({
        id: odai.id,
        title: odai.title,
        imageUrl: odai.imageUrl,
        dueDate: odai.dueDate,
        createdBy: odai.createdBy,
        kotaeCount: odai.kotaeCount,
        voteCount: odai.voteCount,
      }))
      .sort((a, b) => b.dueDate - a.dueDate)
  }

  async getResult(params: OdaiGetResultParams): Promise<OdaiWithResult | ApiError> {
    const result = await this.repository.getResult(params)
    if (!result) return NoFinishedOdaiError
    const userNameMap = await getUserNameMapFromUserId({
      userIdList: [
        ...result.pointStats.map((stat) => stat.userName),
        ...result.countStats.map((stat) => stat.userName),
      ],
    })
    return {
      ...result,
      pointStats: result.pointStats.map((stat) => ({
        ...stat,
        userName: userNameMap[stat.userName],
      })),
      countStats: result.countStats.map((stat) => ({
        ...stat,
        userName: userNameMap[stat.userName],
      })),
    }
  }

  private makeOdaiResult = ({
    odaiId,
    kotaeList,
  }: {
    odaiId: string
    kotaeList: Kotae[]
  }): OdaiResult => {
    const pointRanking = makePointRanking({ kotaeList, filterTopKotae: true })
    const votedCountRanking = makeVotedCountRanking({ kotaeList })
    return {
      id: odaiId,
      kotaeCount: kotaeList.length,
      voteCount: kotaeList.reduce((acc, cur) => acc + cur.votedCount, 0),
      pointStats: pointRanking
        .map((kotae) => ({
          type: 'point' as const,
          kotaeId: kotae.id,
          kotaeContent: kotae.content,
          userName: kotae.createdBy,
          point: kotae.point,
          rank: kotae.rank,
          votedFirstCount: kotae.votedFirstCount,
          votedSecondCount: kotae.votedSecondCount,
          votedThirdCount: kotae.votedThirdCount,
        }))
        // NOTE: ポイント制が無かった時代のデータがあるので、ポイントがNaNのものは除外する
        .filter((stat) => !isNaN(stat.point)),
      countStats: votedCountRanking.map((kotae) => ({
        type: 'count' as const,
        kotaeId: kotae.id,
        kotaeContent: kotae.content,
        userName: kotae.createdBy,
        rank: kotae.rank,
        votedCount: kotae.votedCount,
      })),
    }
  }
}
