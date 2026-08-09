import { SlackPeriodParams } from '../api/Api'
import { Kotae } from '../kotae/Kotae'
import { CountStat, OdaiStatus, PointStat } from '../odai/Odai'
import { AdminAvailableYearsParams } from './AdminAvailableYears'
import { AdminOdaiDetailParams } from './AdminOdaiDetail'
import { AdminOdaiListItem, AdminOdaiListParams } from './AdminOdaiList'
import { AdminSummaryCounts } from './AdminSummary'
import { AdminUserMatrix, AdminUserMatrixParams } from './AdminUserMatrix'
import { AdminUserStatsItem, AdminUserStatsParams } from './AdminUserStats'

/**
 * 読み取り結果
 * 「対象がない」と「取得に失敗した」を呼び出し側で区別できるようにする
 */
export type AdminReadResult<T> =
  | { status: 'ok'; value: T }
  | { status: 'notFound' }
  | { status: 'error' }

export type AdminOdaiDetailSource = {
  odai: {
    /** お題 ID */
    id: string
    /** お題のタイトル */
    title: string
    /** お題の進行状態 */
    status: OdaiStatus
    /** 締切（Unix ミリ秒） */
    dueDate: number
    /** 作成日時（Unix ミリ秒） */
    createdAt: number
  }
  /** 得票数つきの回答一覧 */
  kotaeList: Kotae[]
  /** 1 回以上投票した人数 */
  voteUserCount: number
  /** 発表済みの結果。未発表なら null */
  publishedResult: {
    /** 打点王の順位。並び順は保証しないため、表示側で並べ替える */
    pointStats: PointStat[]
    /** 首位打者の順位。並び順は保証しないため、表示側で並べ替える */
    countStats: CountStat[]
    /** 発表日時（Unix ミリ秒） */
    publishedAt: number
  } | null
}

/**
 * ユーザー別集計のうち、DB だけで決まる部分
 * 表示名は Slack から引くため、repository では扱わない
 */
export type AdminUserStatsSource = {
  /** 期間内に作成されたお題の数 */
  odaiCount: number
  /** 期間内に回答か投票をしたユーザー。並び順は保証しない */
  users: Omit<AdminUserStatsItem, 'name'>[]
}

export interface AdminReportingRepository {
  /**
   * 指定期間の集計値を取得する
   */
  getSummaryCounts(
    params: SlackPeriodParams,
  ): Promise<AdminReadResult<AdminSummaryCounts>>
  /**
   * 指定期間のお題を集計値つきで新しい順に取得する
   */
  getOdaiList(
    params: AdminOdaiListParams,
  ): Promise<AdminReadResult<AdminOdaiListItem[]>>
  /**
   * お題が 1 件以上ある年を新しい順に取得する
   * 管理画面の期間選択に、実際にデータがある年だけを並べるために使う
   */
  getAvailableYears(
    params: AdminAvailableYearsParams,
  ): Promise<AdminReadResult<number[]>>
  /**
   * 1 件のお題について、集計と順位の材料をまとめて取得する
   */
  getOdaiDetailSource(
    params: AdminOdaiDetailParams,
  ): Promise<AdminReadResult<AdminOdaiDetailSource>>
  /**
   * 指定期間の回答数と投票数をユーザーごとに取得する
   * 誰がどれだけ参加しているかを一覧するために使う
   */
  getUserStats(
    params: AdminUserStatsParams,
  ): Promise<AdminReadResult<AdminUserStatsSource>>
  /**
   * 指定期間のお題 × ユーザーの回答数と投票数を取得する
   * 合計だけでは見えない参加の途切れを追うために使う
   */
  getUserMatrixSource(
    params: AdminUserMatrixParams,
  ): Promise<AdminReadResult<AdminUserMatrix>>
}
