import { z } from 'zod'

import {
  createAdminApiUrl,
  fetchAdminApi,
} from '@/features/shared/api/adminApiClient'
import { ADMIN_REPORTING_REVALIDATE_SECONDS } from '@/features/shared/lib/adminCache'

const adminAvailableYearsSchema = z.object({
  years: z.array(z.number()),
})

/**
 * 期間選択に並べる年を取得する
 * 期間はどの画面でも同じ選択肢から選ぶため、画面ごとに持たず共通で引く
 */
export async function getAdminAvailableYears() {
  return fetchAdminApi(
    createAdminApiUrl('years'),
    adminAvailableYearsSchema,
    ADMIN_REPORTING_REVALIDATE_SECONDS,
  )
}
