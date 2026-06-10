import { getAdminDashboardMetrics } from '@/features/dashboard/api/adminDashboardMetrics'

import { AdminMetricCard, AdminMetricCardSkeleton } from './AdminMetricCard'

export async function AdminDashboardMetrics() {
  const metrics = await getAdminDashboardMetrics()

  return (
    <div className="flex flex-wrap gap-1" aria-label="管理画面の集計値">
      <AdminMetricCard title="お題の数" value={metrics.odaiCount} />
      <AdminMetricCard title="答えの数" value={metrics.kotaeCount} />
      <AdminMetricCard title="投票の数" value={metrics.voteCount} />
    </div>
  )
}

export function AdminDashboardMetricsSkeleton() {
  return (
    <div
      className="flex flex-wrap gap-1"
      aria-label="管理画面の集計値を読み込み中"
      aria-busy="true"
    >
      <AdminMetricCardSkeleton title="お題の数" />
      <AdminMetricCardSkeleton title="答えの数" />
      <AdminMetricCardSkeleton title="投票の数" />
    </div>
  )
}
