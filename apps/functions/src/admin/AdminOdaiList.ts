import { PeriodParams } from '../api/Api'
import { OdaiStatus } from '../odai/Odai'

export type AdminOdaiListItem = {
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
  /** 結果を発表した日時（Unix ミリ秒）。未発表なら null */
  publishedAt: number | null
  /** 回答の件数 */
  kotaeCount: number
  /** 回答した人数 */
  kotaeUserCount: number
  /** 投票の件数 */
  voteCount: number
  /** 投票した人数 */
  voteUserCount: number
}

export type AdminOdaiList = {
  /** 新しい順に並んだお題 */
  items: AdminOdaiListItem[]
}

export type AdminOdaiListParams = {
  /** 集計対象の Slack チーム ID */
  slackTeamId: string
} & PeriodParams
