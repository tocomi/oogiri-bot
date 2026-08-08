import { z } from 'zod'

import {
  createAdminApiUrl,
  fetchAdminApi,
} from '@/features/shared/api/adminApiClient'

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

const adminAvailableYearsSchema = z.object({
  years: z.array(z.number()),
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

type PeriodRange = {
  /** 集計期間の開始（Unix ミリ秒） */
  from: number
  /** 集計期間の終了（Unix ミリ秒） */
  to: number
}

/**
 * 期間選択に並べる年を取得する
 */
export async function getAdminAvailableYears() {
  return fetchAdminApi(createAdminApiUrl('years'), adminAvailableYearsSchema)
}

/**
 * 集計タイルに表示する数値を取得する
 */
export async function getAdminSummary({ from, to }: PeriodRange) {
  return fetchAdminApi(
    createAdminApiUrl('summary', { from: String(from), to: String(to) }),
    adminSummarySchema,
  )
}

/**
 * 一覧に表示するお題を取得する
 */
export async function getAdminOdaiList({ from, to }: PeriodRange) {
  return fetchAdminApi(
    createAdminApiUrl('odai', { from: String(from), to: String(to) }),
    adminOdaiListSchema,
  )
}

/**
 * 詳細ペインに表示する 1 件のお題を取得する
 */
export async function getAdminOdaiDetail(odaiId: string) {
  return fetchAdminApi(
    createAdminApiUrl(`odai/${encodeURIComponent(odaiId)}`),
    adminOdaiDetailSchema,
  )
}
