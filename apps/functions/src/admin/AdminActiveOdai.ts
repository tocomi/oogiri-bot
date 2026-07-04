import { OdaiStatus } from '../odai/Odai'

export type AdminActiveOdai = {
  /** お題 ID */
  id: string
  /** お題のタイトル */
  title: string
  /** お題の進行状態 */
  status: Exclude<OdaiStatus, 'finished'>
  /** 締切（Unix ミリ秒） */
  dueDate: number
  /** 作成日時（Unix ミリ秒） */
  createdAt: number
  /** 現在の回答数 */
  kotaeCount: number
  /** 現在の投票数 */
  voteCount: number
}

export type AdminActiveOdaiOverview =
  | {
      /** アクティブなお題がない */
      active: false
    }
  | {
      /** アクティブなお題がある */
      active: true
      odai: AdminActiveOdai
    }

export type AdminActiveOdaiParams = {
  /** 集計対象の Slack チーム ID */
  slackTeamId: string
}
