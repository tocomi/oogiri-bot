import { PeriodParams, SlackParams } from '../api/Api'

/**
 * ヒートマップの列に並べるお題の数の上限
 * 全期間を選ぶとお題が数百件になり得るため、直近だけに絞って横幅とレスポンスを抑える
 */
export const ADMIN_USER_MATRIX_ODAI_LIMIT = 30

export type AdminUserMatrixOdai = {
  /** お題 ID */
  id: string
  /** お題のタイトル */
  title: string
  /** 作成日時（Unix ミリ秒） */
  createdAt: number
}

export type AdminUserMatrixRow = {
  /** Slack のユーザー ID */
  userId: string
  /** odaiList と同じ並びの回答数 */
  kotaeCounts: number[]
  /** odaiList と同じ並びの投票数 */
  voteCounts: number[]
}

export type AdminUserMatrix = {
  /** 列に並べるお題。古い順 */
  odaiList: AdminUserMatrixOdai[]
  /** 期間内のお題の総数。列を絞ったことを画面に出すために使う */
  totalOdaiCount: number
  /**
   * ユーザーごとの行
   * 並び順は画面が一覧と揃えるため、ここでは決めない
   */
  rows: AdminUserMatrixRow[]
}

export type AdminUserMatrixParams = SlackParams & PeriodParams
