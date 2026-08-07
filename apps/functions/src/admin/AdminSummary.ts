import { PeriodParams } from '../api/Api'

export type AdminSummaryCounts = {
  /** 期間内に作成されたお題の数 */
  odaiCount: number
  /** 期間内に投稿された回答の数 */
  kotaeCount: number
  /** 期間内に投じられた投票の数 */
  voteCount: number
  /** 期間内に 1 回以上回答した人の数 */
  kotaeUserCount: number
  /** 期間内に 1 回以上投票した人の数 */
  voteUserCount: number
}

export type AdminSummary = {
  /** 集計した期間 */
  period: PeriodParams
  /** 集計期間の実績 */
  current: AdminSummaryCounts
  /** 同じ長さだけ前にずらした期間の実績 */
  previous: AdminSummaryCounts
}

export type AdminSummaryParams = {
  /** 集計対象の Slack チーム ID */
  slackTeamId: string
} & PeriodParams

/**
 * 前期比の比較対象となる、同じ長さだけ前にずらした期間を求める
 * 画面側で期間の長さを意識せずに前期比を出せるようにするために使う
 */
export const createPreviousPeriod = ({
  from,
  to,
}: PeriodParams): PeriodParams => {
  const length = to - from
  return { from: from - length, to: from }
}
