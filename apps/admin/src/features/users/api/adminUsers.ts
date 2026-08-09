import { z } from 'zod'

import type { AdminPeriodRange } from '@/features/shared/api/adminApiClient'

import {
  createAdminApiUrl,
  createAdminPeriodParams,
  fetchAdminApi,
} from '@/features/shared/api/adminApiClient'
import { ADMIN_REPORTING_REVALIDATE_SECONDS } from '@/features/shared/lib/adminCache'

const adminUserStatsItemSchema = z.object({
  userId: z.string(),
  name: z.string().nullable(),
  kotaeCount: z.number(),
  voteCount: z.number(),
  kotaeOdaiCount: z.number(),
  voteOdaiCount: z.number(),
})

const adminUserStatsSchema = z.object({
  odaiCount: z.number(),
  items: z.array(adminUserStatsItemSchema),
})

const adminUserMatrixOdaiSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.number(),
})

const adminUserMatrixRowSchema = z.object({
  userId: z.string(),
  kotaeCounts: z.array(z.number()),
  voteCounts: z.array(z.number()),
})

const adminUserMatrixSchema = z.object({
  odaiList: z.array(adminUserMatrixOdaiSchema),
  totalOdaiCount: z.number(),
  rows: z.array(adminUserMatrixRowSchema),
})

export type AdminUserStatsItem = z.infer<typeof adminUserStatsItemSchema>
export type AdminUserStats = z.infer<typeof adminUserStatsSchema>
export type AdminUserMatrixOdai = z.infer<typeof adminUserMatrixOdaiSchema>
export type AdminUserMatrixRow = z.infer<typeof adminUserMatrixRowSchema>
export type AdminUserMatrix = z.infer<typeof adminUserMatrixSchema>

/**
 * ユーザーごとの回答数と投票数を取得する
 * 一覧と散布図はこの 1 本で描く
 */
export async function getAdminUserStats(range: AdminPeriodRange) {
  return fetchAdminApi(
    createAdminApiUrl('users', createAdminPeriodParams(range)),
    adminUserStatsSchema,
    ADMIN_REPORTING_REVALIDATE_SECONDS,
  )
}

/**
 * ヒートマップに表示するお題 × ユーザーの集計を取得する
 * 一覧より重いため画面の描画とは切り離して取得する
 */
export async function getAdminUserMatrix(range: AdminPeriodRange) {
  return fetchAdminApi(
    createAdminApiUrl('users/matrix', createAdminPeriodParams(range)),
    adminUserMatrixSchema,
    ADMIN_REPORTING_REVALIDATE_SECONDS,
  )
}
