import { SlackPeriodParams } from '../api/Api'
import { AdminOdaiListItem, AdminOdaiListParams } from './AdminOdaiList'
import { AdminSummaryCounts } from './AdminSummary'

export interface AdminReportingRepository {
  /**
   * 指定期間の集計値を取得する
   * 取得に失敗した場合は、0 件と区別するため null を返す
   */
  getSummaryCounts(
    params: SlackPeriodParams,
  ): Promise<AdminSummaryCounts | null>
  /**
   * 指定期間のお題を集計値つきで新しい順に取得する
   * 取得に失敗した場合は、0 件と区別するため null を返す
   */
  getOdaiList(params: AdminOdaiListParams): Promise<AdminOdaiListItem[] | null>
}
