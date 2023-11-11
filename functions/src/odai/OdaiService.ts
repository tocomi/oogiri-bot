import { OdaiRepository } from './OdaiRepository'
import {
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiFinishParams,
  OdaiFinishedListParams,
  OdaiFinishedListResponse,
  OdaiPostRequestParams,
  OdaiPutApiStatus,
  OdaiPutStatusParams,
  OdaiRecentFinishedParams,
  OdaiRecentFinishedResponse,
  OdaiResult,
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
import { Kotae } from '../kotae/Kotae'
import { makePointRanking } from '../kotae/rank/makePointRanking'
import { makeVotedCountRanking } from '../kotae/rank/makeVotedCountRanking'

export interface OdaiService {
  create(params: OdaiPostRequestParams): Promise<ApiPostStatus>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse>
  getRecentFinished(params: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse>
  getRecent5timesFinished(params: OdaiFinishedListParams): Promise<OdaiFinishedListResponse>
  startVoting(params: OdaiPutStatusParams): Promise<OdaiPutApiStatus>

  /** お題の完了。ステータスの更新と結果データの登録を行う。 */
  finish(params: OdaiFinishParams): Promise<OdaiPutApiStatus>
}

export class OdaiServiceImpl implements OdaiService {
  repository: OdaiRepository

  constructor(repository: OdaiRepository) {
    this.repository = repository
  }

  async create(params: OdaiPostRequestParams): Promise<ApiPostStatus> {
    const currentOdai = await this.repository.getCurrent(params)
    if (currentOdai) return OdaiDuplicationError

    const result =
      params.type === 'normal'
        ? await this.repository.createNormal(params)
        : await this.repository.createIppon(params)
    return result ? 'ok' : InternalServerError
  }

  async getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse> {
    const currentOdai = await this.repository.getCurrent(params)
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

    const result = await this.repository.updateStatus(
      { slackTeamId: params.slackTeamId, status: 'voting' },
      currentOdai.docId
    )
    return result ? 'ok' : InternalServerError
  }

  async finish({ slackTeamId, kotaeList }: OdaiFinishParams): Promise<OdaiPutApiStatus> {
    const currentOdai = await this.getCurrent({ slackTeamId })
    if (hasError(currentOdai)) return currentOdai
    if (currentOdai.type === 'normal' && currentOdai.status !== 'voting') return NoVotingOdaiError

    // NOTE: お題の結果を result フィールドに格納する
    const odaiResult = this.makeOdaiResult({ odaiId: currentOdai.docId, kotaeList })
    await this.repository.addResultField({ slackTeamId, odaiResult })

    const result = await this.repository.updateStatus(
      { slackTeamId, status: 'finished' },
      currentOdai.docId
    )
    return result ? 'ok' : InternalServerError
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
          kotaeContent: kotae.content,
          userName: kotae.createdBy,
          point: kotae.point,
          votedFirstCount: kotae.votedFirstCount,
          votedSecondCount: kotae.votedSecondCount,
          votedThirdCount: kotae.votedThirdCount,
        }))
        // NOTE: ポイント制が無かった時代のデータがあるので、ポイントがNaNのものは除外する
        .filter((stat) => !isNaN(stat.point)),
      countStats: votedCountRanking.map((kotae) => ({
        type: 'count' as const,
        kotaeContent: kotae.content,
        userName: kotae.createdBy,
        votedCount: kotae.votedCount,
      })),
    }
  }
}
