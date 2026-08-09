import { z } from 'zod'

import type { AdminPeriodRange } from '@/features/shared/api/adminApiClient'

import {
  createAdminApiUrl,
  createAdminPeriodParams,
  fetchAdminApi,
} from '@/features/shared/api/adminApiClient'
import {
  ADMIN_NO_CACHE_SECONDS,
  ADMIN_REPORTING_REVALIDATE_SECONDS,
} from '@/features/shared/lib/adminCache'

const odaiStatusSchema = z.enum(['posting', 'voting', 'finished'])

const summaryCountsSchema = z.object({
  odaiCount: z.number(),
  kotaeCount: z.number(),
  voteCount: z.number(),
  kotaeUserCount: z.number(),
  voteUserCount: z.number(),
})

const adminSummarySchema = z.object({
  period: z.object({ from: z.number(), to: z.number() }),
  current: summaryCountsSchema,
  previous: summaryCountsSchema.nullable(),
})

const adminOdaiListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: odaiStatusSchema,
  dueDate: z.number(),
  createdAt: z.number(),
  publishedAt: z.number().nullable(),
  kotaeCount: z.number(),
  kotaeUserCount: z.number(),
  voteCount: z.number(),
  voteUserCount: z.number(),
})

const adminOdaiListSchema = z.object({
  items: z.array(adminOdaiListItemSchema),
})

const adminRankedKotaeSchema = z.object({
  kotaeId: z.string(),
  content: z.string(),
  rank: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  point: z.number(),
  authorName: z.string().nullable(),
})

const adminOdaiDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: odaiStatusSchema,
  dueDate: z.number(),
  createdAt: z.number(),
  publishedAt: z.number().nullable(),
  kotaeCount: z.number(),
  kotaeUserCount: z.number(),
  voteCount: z.number(),
  voteUserCount: z.number(),
  pointRanking: z.array(adminRankedKotaeSchema),
  countRanking: z.array(adminRankedKotaeSchema),
  voteDistribution: z.object({
    top3: z.number(),
    rank4to10: z.number(),
    rest: z.number(),
  }),
})

export type AdminSummary = z.infer<typeof adminSummarySchema>
export type AdminOdaiListItem = z.infer<typeof adminOdaiListItemSchema>
export type AdminRankedKotae = z.infer<typeof adminRankedKotaeSchema>
export type AdminOdaiDetail = z.infer<typeof adminOdaiDetailSchema>

/**
 * 集計タイルに表示する数値を取得する
 */
export async function getAdminSummary(range: AdminPeriodRange) {
  return fetchAdminApi(
    createAdminApiUrl('summary', createAdminPeriodParams(range)),
    adminSummarySchema,
    ADMIN_REPORTING_REVALIDATE_SECONDS,
  )
}

/**
 * 一覧に表示するお題を取得する
 */
export async function getAdminOdaiList(range: AdminPeriodRange) {
  return fetchAdminApi(
    createAdminApiUrl('odai', createAdminPeriodParams(range)),
    adminOdaiListSchema,
    ADMIN_REPORTING_REVALIDATE_SECONDS,
  )
}

/**
 * 詳細ペインに表示する 1 件のお題を取得する
 * 開いたお題の数値は一覧より細かく見るため、毎回取得して最新にする
 */
export async function getAdminOdaiDetail(odaiId: string) {
  return fetchAdminApi(
    createAdminApiUrl(`odai/${encodeURIComponent(odaiId)}`),
    adminOdaiDetailSchema,
    ADMIN_NO_CACHE_SECONDS,
  )
}
