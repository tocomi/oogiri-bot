import { ApiError, InternalServerError } from '../api/Error'
import { KotaeRepository } from '../kotae/KotaeRepository'
import { OdaiRepository } from '../odai/OdaiRepository'
import { VoteRepository } from '../vote/VoteRepository'
import {
  AdminDashboardMetrics,
  AdminDashboardMetricsParams,
} from './AdminDashboardMetrics'

type CountableOdaiRepository = Pick<OdaiRepository, 'countAll'>
type CountableKotaeRepository = Pick<KotaeRepository, 'countAll'>
type CountableVoteRepository = Pick<VoteRepository, 'countAll'>

export interface AdminDashboardMetricsService {
  /**
   * 管理画面のダッシュボードに表示する集計値を取得する
   * 各フィーチャーの repository から必要な数値を集め、管理画面用の形に組み立てるために使う
   */
  get(
    params: AdminDashboardMetricsParams,
  ): Promise<AdminDashboardMetrics | ApiError>
}

export class AdminDashboardMetricsServiceImpl implements AdminDashboardMetricsService {
  private odaiRepository: CountableOdaiRepository
  private kotaeRepository: CountableKotaeRepository
  private voteRepository: CountableVoteRepository

  constructor({
    odaiRepository,
    kotaeRepository,
    voteRepository,
  }: {
    odaiRepository: CountableOdaiRepository
    kotaeRepository: CountableKotaeRepository
    voteRepository: CountableVoteRepository
  }) {
    this.odaiRepository = odaiRepository
    this.kotaeRepository = kotaeRepository
    this.voteRepository = voteRepository
  }

  /**
   * 管理画面のダッシュボードに表示する集計値を取得する
   * 各 repository の取得失敗を API 共通の InternalServerError に変換するために使う
   */
  async get({
    slackTeamId,
  }: AdminDashboardMetricsParams): Promise<AdminDashboardMetrics | ApiError> {
    const [odaiCount, kotaeCount, voteCount] = await Promise.all([
      this.odaiRepository.countAll({ slackTeamId }),
      this.kotaeRepository.countAll({ slackTeamId }),
      this.voteRepository.countAll({ slackTeamId }),
    ])

    if (odaiCount === null || kotaeCount === null || voteCount === null) {
      return InternalServerError
    }

    return {
      kotaeCount,
      odaiCount,
      voteCount,
    }
  }
}
