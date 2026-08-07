import { ApiError, NoTargetOdaiError } from '../api/Error'
import { Kotae } from '../kotae/Kotae'
import { KotaeRepository } from '../kotae/KotaeRepository'
import { makePointRanking } from '../kotae/rank/makePointRanking'
import { makeVotedCountRanking } from '../kotae/rank/makeVotedCountRanking'
import { CountStat, PointStat } from '../odai/Odai'
import { OdaiRepository } from '../odai/OdaiRepository'
import {
  AdminOdaiDetail,
  AdminOdaiDetailParams,
  AdminRankedKotae,
  AdminVoteDistribution,
} from './AdminOdaiDetail'
import { AdminUserNameResolver } from './AdminUserNameResolver'

type DetailOdaiRepository = Pick<OdaiRepository, 'getById' | 'getResult'>
type DetailKotaeRepository = Pick<KotaeRepository, 'getAllOfCurrentOdai'>

/**
 * 票が上位・中位・下位のどこに集まったかを求める
 */
const createVoteDistribution = (kotaeList: Kotae[]): AdminVoteDistribution => {
  const sorted = [...kotaeList].sort((a, b) => b.votedCount - a.votedCount)
  const sum = (list: Kotae[]) =>
    list.reduce((total, kotae) => total + kotae.votedCount, 0)

  return {
    top3: sum(sorted.slice(0, 3)),
    rank4to10: sum(sorted.slice(3, 10)),
    rest: sum(sorted.slice(10)),
  }
}

/**
 * 発表済みの順位に表示名を添える
 */
const createPublishedRanking = (
  stats: (PointStat | CountStat)[],
  nameMap: { [userId: string]: string },
): AdminRankedKotae[] =>
  stats.map((stat) => ({
    authorName: nameMap[stat.userName] ?? null,
    content: stat.kotaeContent,
    kotaeId: stat.kotaeId,
    point: stat.type === 'point' ? stat.point : stat.votedCount,
    rank: stat.rank,
  }))

/**
 * 発表前の暫定順位を、回答者を伏せた形で組み立てる
 */
const createProvisionalRanking = (
  ranked: { id: string; content: string; rank: 1 | 2 | 3 }[],
  getPoint: (index: number) => number,
): AdminRankedKotae[] =>
  ranked.map((kotae, index) => ({
    authorName: null,
    content: kotae.content,
    kotaeId: kotae.id,
    point: getPoint(index),
    rank: kotae.rank,
  }))

export interface AdminOdaiDetailService {
  /**
   * 管理画面で 1 件のお題の集計と順位を取得する
   */
  get(params: AdminOdaiDetailParams): Promise<AdminOdaiDetail | ApiError>
}

export class AdminOdaiDetailServiceImpl implements AdminOdaiDetailService {
  private odaiRepository: DetailOdaiRepository
  private kotaeRepository: DetailKotaeRepository
  private userNameResolver: AdminUserNameResolver

  constructor({
    odaiRepository,
    kotaeRepository,
    userNameResolver,
  }: {
    odaiRepository: DetailOdaiRepository
    kotaeRepository: DetailKotaeRepository
    userNameResolver: AdminUserNameResolver
  }) {
    this.odaiRepository = odaiRepository
    this.kotaeRepository = kotaeRepository
    this.userNameResolver = userNameResolver
  }

  async get({
    slackTeamId,
    odaiId,
  }: AdminOdaiDetailParams): Promise<AdminOdaiDetail | ApiError> {
    const odai = await this.odaiRepository.getById({ odaiId, slackTeamId })
    if (!odai) return NoTargetOdaiError

    // NOTE: 結果レコードは status が finished になる前に作られるため、
    //       結果の有無ではなく status を発表済みの判定に使う
    const isPublished = odai.status === 'finished'

    const [kotaeList, odaiResult] = await Promise.all([
      this.kotaeRepository.getAllOfCurrentOdai({ slackTeamId }, odaiId),
      isPublished
        ? this.odaiRepository.getResult({ odaiId, slackTeamId })
        : null,
    ])

    const base = {
      createdAt: odai.createdAt,
      dueDate: odai.dueDate,
      id: odai.id,
      kotaeCount: kotaeList.length,
      kotaeUserCount: new Set(kotaeList.map((kotae) => kotae.createdBy)).size,
      noVoteKotaeCount: kotaeList.filter((kotae) => kotae.votedCount === 0)
        .length,
      status: odai.status,
      title: odai.title,
      voteCount: kotaeList.reduce(
        (total, kotae) => total + kotae.votedCount,
        0,
      ),
      voteDistribution: createVoteDistribution(kotaeList),
    }

    if (odaiResult) {
      const stats = [...odaiResult.pointStats, ...odaiResult.countStats]
      const nameMap = await this.userNameResolver.resolve(
        stats.map((stat) => stat.userName),
      )

      return {
        ...base,
        countRanking: createPublishedRanking(odaiResult.countStats, nameMap),
        pointRanking: createPublishedRanking(odaiResult.pointStats, nameMap),
        publishedAt: odaiResult.publishedAt,
      }
    }

    // NOTE: 発表前は Slack にまだ名前が出ていないため、暫定順位では回答者を返さない
    const pointRanked = makePointRanking({ kotaeList })
    const countRanked = makeVotedCountRanking({ kotaeList })

    return {
      ...base,
      countRanking: createProvisionalRanking(
        countRanked,
        (index) => countRanked[index].votedCount,
      ),
      pointRanking: createProvisionalRanking(
        pointRanked,
        (index) => pointRanked[index].point,
      ),
      publishedAt: null,
    }
  }
}
