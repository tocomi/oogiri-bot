import { ApiError, InternalServerError } from '../api/Error'
import { AdminReportingRepository } from './AdminReportingRepository'
import {
  AdminSummary,
  AdminSummaryParams,
  createPreviousPeriod,
} from './AdminSummary'

type SummaryReportingRepository = Pick<
  AdminReportingRepository,
  'getSummaryCounts'
>

export interface AdminSummaryService {
  /**
   * 管理画面の集計タブに表示する数値を取得する
   * 指定期間と、その前の同じ長さの期間をまとめて返すために使う
   */
  get(params: AdminSummaryParams): Promise<AdminSummary | ApiError>
}

export class AdminSummaryServiceImpl implements AdminSummaryService {
  private reportingRepository: SummaryReportingRepository

  constructor({
    reportingRepository,
  }: {
    reportingRepository: SummaryReportingRepository
  }) {
    this.reportingRepository = reportingRepository
  }

  /**
   * 管理画面の集計タブに表示する数値を取得する
   * repository の取得失敗を API 共通の InternalServerError に変換するために使う
   */
  async get({
    slackTeamId,
    from,
    to,
  }: AdminSummaryParams): Promise<AdminSummary | ApiError> {
    const period = { from, to }
    const [current, previous] = await Promise.all([
      this.reportingRepository.getSummaryCounts({ slackTeamId, ...period }),
      this.reportingRepository.getSummaryCounts({
        slackTeamId,
        ...createPreviousPeriod(period),
      }),
    ])

    if (current === null || previous === null) {
      return InternalServerError
    }

    return { current, period, previous }
  }
}
