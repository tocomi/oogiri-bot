import { ApiError, InternalServerError, NoTargetOdaiError } from '../api/Error'
import { Kotae } from '../kotae/Kotae'
import { makePointRanking } from '../kotae/rank/makePointRanking'
import { makeVotedCountRanking } from '../kotae/rank/makeVotedCountRanking'
import { CountStat, PointStat } from '../odai/Odai'
import {
  AdminOdaiDetail,
  AdminOdaiDetailParams,
  AdminRankedKotae,
  AdminVoteDistribution,
} from './AdminOdaiDetail'
import { AdminReportingRepository } from './AdminReportingRepository'
import { AdminUserNameResolver } from './AdminUserNameResolver'

type DetailReportingRepository = Pick<
  AdminReportingRepository,
  'getOdaiDetailSource'
>

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

export interface AdminOdaiDetailService {
  /**
   * 管理画面で 1 件のお題の集計と順位を取得する
   */
  get(params: AdminOdaiDetailParams): Promise<AdminOdaiDetail | ApiError>
}

export class AdminOdaiDetailServiceImpl implements AdminOdaiDetailService {
  private reportingRepository: DetailReportingRepository
  private userNameResolver: AdminUserNameResolver

  constructor({
    reportingRepository,
    userNameResolver,
  }: {
    reportingRepository: DetailReportingRepository
    userNameResolver: AdminUserNameResolver
  }) {
    this.reportingRepository = reportingRepository
    this.userNameResolver = userNameResolver
  }

  async get(
    params: AdminOdaiDetailParams,
  ): Promise<AdminOdaiDetail | ApiError> {
    const source = await this.reportingRepository.getOdaiDetailSource(params)
    if (source.status === 'notFound') return NoTargetOdaiError
    if (source.status === 'error') return InternalServerError

    const { odai, kotaeList, publishedResult, voteUserCount } = source.value

    const base = {
      createdAt: odai.createdAt,
      dueDate: odai.dueDate,
      id: odai.id,
      kotaeCount: kotaeList.length,
      kotaeUserCount: new Set(kotaeList.map((kotae) => kotae.createdBy)).size,
      status: odai.status,
      title: odai.title,
      voteUserCount,
      voteCount: kotaeList.reduce(
        (total, kotae) => total + kotae.votedCount,
        0,
      ),
      voteDistribution: createVoteDistribution(kotaeList),
    }

    if (publishedResult) {
      const stats = [
        ...publishedResult.pointStats,
        ...publishedResult.countStats,
      ]
      const nameMap = await this.userNameResolver.resolve(
        stats.map((stat) => stat.userName),
      )

      return {
        ...base,
        countRanking: createPublishedRanking(
          publishedResult.countStats,
          nameMap,
        ),
        pointRanking: createPublishedRanking(
          publishedResult.pointStats,
          nameMap,
        ),
        publishedAt: publishedResult.publishedAt,
      }
    }

    // NOTE: 発表前は Slack にまだ名前が出ていないため、暫定順位では回答者を返さない
    return {
      ...base,
      countRanking: makeVotedCountRanking({ kotaeList }).map((kotae) => ({
        authorName: null,
        content: kotae.content,
        kotaeId: kotae.id,
        point: kotae.votedCount,
        rank: kotae.rank,
      })),
      pointRanking: makePointRanking({ kotaeList }).map((kotae) => ({
        authorName: null,
        content: kotae.content,
        kotaeId: kotae.id,
        point: kotae.point,
        rank: kotae.rank,
      })),
      publishedAt: null,
    }
  }
}
