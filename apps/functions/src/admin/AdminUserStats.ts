import { PeriodParams, SlackParams } from '../api/Api'

export type AdminUserStatsItem = {
  /** Slack のユーザー ID */
  userId: string
  /** Slack の表示名。引けなかった場合は null */
  name: string | null
  /** 期間内に投稿した回答の数 */
  kotaeCount: number
  /** 期間内に投じた投票の数 */
  voteCount: number
  /** 期間内に 1 回以上回答したお題の数 */
  kotaeOdaiCount: number
  /** 期間内に 1 回以上投票したお題の数 */
  voteOdaiCount: number
}

export type AdminUserStats = {
  /** 期間内に作成されたお題の数。参加率の分母に使う */
  odaiCount: number
  /** 回答数の多い順に並んだユーザー */
  items: AdminUserStatsItem[]
}

export type AdminUserStatsParams = SlackParams & PeriodParams

/**
 * ユーザーを回答数の多い順に並べる
 * 回答数が同じ場合の並びが実行ごとに揺れないよう、投票数とユーザー ID で確定させる
 */
export const compareAdminUserStats = (
  a: AdminUserStatsItem,
  b: AdminUserStatsItem,
) => {
  if (a.kotaeCount !== b.kotaeCount) return b.kotaeCount - a.kotaeCount
  if (a.voteCount !== b.voteCount) return b.voteCount - a.voteCount
  return a.userId.localeCompare(b.userId)
}
