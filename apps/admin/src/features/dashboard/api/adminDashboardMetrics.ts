import { z } from 'zod'

const adminDashboardMetricsSchema = z.object({
  /** 登録されている答えの総数 */
  kotaeCount: z.number(),
  /** 登録されているお題の総数 */
  odaiCount: z.number(),
  /** 登録されている投票の総数 */
  voteCount: z.number(),
})
const adminApiBaseUrlSchema = z.string().min(1)
const adminSlackTeamIdSchema = z.string().min(1)

export type AdminDashboardMetrics = {
  /** 登録されているお題の総数 */
  odaiCount: number
  /** 投稿されている答えの総数 */
  kotaeCount: number
  /** 投稿されている投票の総数 */
  voteCount: number
}

/**
 * 管理画面 API の base URL を取得する
 * デプロイ先や emulator の URL 差分をコードへ埋め込まず、環境設定に寄せるために使う
 */
const getAdminApiBaseUrl = () => {
  return adminApiBaseUrlSchema.parse(process.env.ADMIN_API_BASE_URL)
}

/**
 * 管理対象の Slack チーム ID を取得する
 * 集計 API が workspace をまたいだ値を返さないよう、環境設定から対象チームを明示するために使う
 */
const getAdminSlackTeamId = () => {
  return adminSlackTeamIdSchema.parse(process.env.ADMIN_SLACK_TEAM_ID)
}

/**
 * Admin API の endpoint URL を組み立てる
 * Firebase Functions の関数名を含む base path を落とさないために使う
 */
const createAdminApiUrl = (path: string) => {
  return new URL(path, `${getAdminApiBaseUrl().replace(/\/$/, '')}/`)
}

/**
 * ダッシュボード集計 API の endpoint URL を組み立てる
 * API 境界に必須の slackTeamId query を必ず含めるために使う
 */
const createAdminDashboardMetricsUrl = () => {
  const url = createAdminApiUrl('dashboard/metrics')
  url.searchParams.set('slackTeamId', getAdminSlackTeamId())
  return url
}

/**
 * ダッシュボードに表示する集計値を Admin API から取得する
 * Server Component 側で実行し、DB 接続情報を管理画面 client に渡さないために使う
 */
export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const response = await fetch(createAdminDashboardMetricsUrl(), {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch admin dashboard metrics: ${response.status}`,
    )
  }

  return adminDashboardMetricsSchema.parse(await response.json())
}
