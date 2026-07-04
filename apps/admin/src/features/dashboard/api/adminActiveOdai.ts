import { z } from 'zod'

const adminActiveOdaiSchema = z.object({
  createdAt: z.number(),
  dueDate: z.number(),
  id: z.string(),
  kotaeCount: z.number(),
  status: z.enum(['posting', 'voting']),
  title: z.string(),
  voteCount: z.number(),
})

const adminActiveOdaiOverviewSchema = z.discriminatedUnion('active', [
  z.object({
    active: z.literal(false),
  }),
  z.object({
    active: z.literal(true),
    odai: adminActiveOdaiSchema,
  }),
])

const adminApiBaseUrlSchema = z.string().min(1)
const adminSlackTeamIdSchema = z.string().min(1)

export type AdminActiveOdai = {
  /** お題 ID */
  id: string
  /** お題のタイトル */
  title: string
  /** お題の進行状態 */
  status: 'posting' | 'voting'
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
      active: false
    }
  | {
      active: true
      odai: AdminActiveOdai
    }

/**
 * 管理画面 API の base URL を取得する
 */
const getAdminApiBaseUrl = () => {
  return adminApiBaseUrlSchema.parse(process.env.ADMIN_API_BASE_URL)
}

/**
 * 管理対象の Slack チーム ID を取得する
 */
const getAdminSlackTeamId = () => {
  return adminSlackTeamIdSchema.parse(process.env.ADMIN_SLACK_TEAM_ID)
}

/**
 * Admin API の endpoint URL を組み立てる
 */
const createAdminApiUrl = (path: string) => {
  return new URL(path, `${getAdminApiBaseUrl().replace(/\/$/, '')}/`)
}

/**
 * アクティブお題 API の endpoint URL を組み立てる
 */
const createAdminActiveOdaiUrl = () => {
  const url = createAdminApiUrl('dashboard/active-odai')
  url.searchParams.set('slackTeamId', getAdminSlackTeamId())
  return url
}

/**
 * アクティブお題の概要を Admin API から取得する
 */
export async function getAdminActiveOdaiOverview(): Promise<AdminActiveOdaiOverview> {
  const response = await fetch(createAdminActiveOdaiUrl(), {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch admin active odai: ${response.status}`)
  }

  return adminActiveOdaiOverviewSchema.parse(await response.json())
}
