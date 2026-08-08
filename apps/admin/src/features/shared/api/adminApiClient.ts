import { z } from 'zod'

const adminApiBaseUrlSchema = z.string().min(1)
const adminSlackTeamIdSchema = z.string().min(1)

/**
 * 管理画面 API の base URL を取得する
 */
const getAdminApiBaseUrl = () => {
  return adminApiBaseUrlSchema.parse(process.env.ADMIN_API_BASE_URL)
}

/**
 * 管理対象の Slack チーム ID を取得する
 */
export const getAdminSlackTeamId = () => {
  return adminSlackTeamIdSchema.parse(process.env.ADMIN_SLACK_TEAM_ID)
}

/**
 * Admin API の endpoint URL を組み立てる
 * slackTeamId は全 endpoint で必要なため、ここで必ず付与する
 */
export const createAdminApiUrl = (
  path: string,
  searchParams: Record<string, string> = {},
) => {
  const url = new URL(path, `${getAdminApiBaseUrl().replace(/\/$/, '')}/`)
  url.searchParams.set('slackTeamId', getAdminSlackTeamId())
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return url
}

/**
 * Admin API から JSON を取得し、schema で検証する
 * 管理画面は常に最新の集計を見せたいため、キャッシュしない
 */
export const fetchAdminApi = async <T>(
  url: URL,
  schema: z.ZodType<T>,
): Promise<T> => {
  const response = await fetch(url, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url.pathname}: ${response.status}`)
  }

  return schema.parse(await response.json())
}
