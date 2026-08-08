import { SlackPeriodParams } from '../api/Api'
import { Kotae } from '../kotae/Kotae'
import { CountStat, OdaiStatus, PointStat } from '../odai/Odai'
import { AdminOdaiDetailParams } from './AdminOdaiDetail'
import { AdminOdaiListItem, AdminOdaiListParams } from './AdminOdaiList'
import { AdminSummaryCounts } from './AdminSummary'

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
    /** 打点王の順位 */
    pointStats: PointStat[]
    /** 首位打者の順位 */
    countStats: CountStat[]
    /** 発表日時（Unix ミリ秒） */
    publishedAt: number
  } | null
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
   * 1 件のお題について、集計と順位の材料をまとめて取得する
   */
  getOdaiDetailSource(
    params: AdminOdaiDetailParams,
  ): Promise<AdminReadResult<AdminOdaiDetailSource>>
}
