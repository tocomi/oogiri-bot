export type AdminDashboardMetrics = {
  /** 登録されているお題の総数 */
  odaiCount: number
  /** 投稿されている答えの総数 */
  kotaeCount: number
  /** 投稿されている投票の総数 */
  voteCount: number
}

export type AdminDashboardMetricsParams = {
  /** 集計対象の Slack チーム ID */
  slackTeamId: string
}
