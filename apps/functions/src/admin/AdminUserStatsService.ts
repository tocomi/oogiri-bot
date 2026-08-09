import { ApiError, InternalServerError } from '../api/Error'
import { AdminReportingRepository } from './AdminReportingRepository'
import { AdminUserNameResolver } from './AdminUserNameResolver'
import {
  AdminUserStats,
  AdminUserStatsParams,
  compareAdminUserStats,
} from './AdminUserStats'

type UserStatsReportingRepository = Pick<
  AdminReportingRepository,
  'getUserStats'
>

export interface AdminUserStatsService {
  /**
   * 管理画面の一覧に表示するユーザー別の集計を取得する
   */
  get(params: AdminUserStatsParams): Promise<AdminUserStats | ApiError>
}

export class AdminUserStatsServiceImpl implements AdminUserStatsService {
  private reportingRepository: UserStatsReportingRepository
  private userNameResolver: AdminUserNameResolver

  constructor({
    reportingRepository,
    userNameResolver,
  }: {
    reportingRepository: UserStatsReportingRepository
    userNameResolver: AdminUserNameResolver
  }) {
    this.reportingRepository = reportingRepository
    this.userNameResolver = userNameResolver
  }

  /**
   * 管理画面の一覧に表示するユーザー別の集計を取得する
   * 意味のある並びは表示側が指標ごとに決め直すため、ここでは順序を確定させるだけにする
   * それでも順序が要るのは、散布図が重なった点をこの順で描くため。
   * 実行ごとに描画順が入れ替わらないよう、回答数の多い順で確定させる
   */
  async get(params: AdminUserStatsParams): Promise<AdminUserStats | ApiError> {
    const source = await this.reportingRepository.getUserStats(params)
    if (source.status !== 'ok') return InternalServerError

    const { odaiCount, users } = source.value

    // NOTE: 退職などで引けないユーザーが混ざっても一覧からは落とさず、名前なしとして扱う
    const nameMap = await this.userNameResolver.resolve(
      users.map((user) => user.userId),
    )

    const items = users
      .map((user) => ({ ...user, name: nameMap[user.userId] ?? null }))
      .sort(compareAdminUserStats)

    return { items, odaiCount }
  }
}
