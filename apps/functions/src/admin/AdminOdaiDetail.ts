import { OdaiStatus } from '../odai/Odai'

export type AdminRankedKotae = {
  /** 回答 ID */
  kotaeId: string
  /** 回答の内容 */
  content: string
  /** 順位 */
  rank: 1 | 2 | 3
  /** 打点王ならポイント、首位打者なら票数 */
  point: number
  /** 回答者の表示名。結果発表前は null */
  authorName: string | null
}

export type AdminVoteDistribution = {
  /** 1〜3 位に入った票数 */
  top3: number
  /** 4〜10 位に入った票数 */
  rank4to10: number
  /** 11 位以下に入った票数 */
  rest: number
}

export type AdminOdaiDetail = {
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
  /** 1 回以上投票した人数 */
  voteUserCount: number
  /** 打点王（ポイント）の上位 */
  pointRanking: AdminRankedKotae[]
  /** 首位打者（総票数）の上位 */
  countRanking: AdminRankedKotae[]
  /** 票がどこに集まったか */
  voteDistribution: AdminVoteDistribution
}

export type AdminOdaiDetailParams = {
  /** 集計対象の Slack チーム ID */
  slackTeamId: string
  /** 取得するお題 ID */
  odaiId: string
}
