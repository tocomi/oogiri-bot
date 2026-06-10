import { Suspense } from 'react'

import {
  AdminDashboardMetrics,
  AdminDashboardMetricsSkeleton,
} from '@/features/dashboard/components/AdminDashboardMetrics'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="min-h-dvh p-6 sm:p-10">
      <section
        className="mx-auto grid w-full max-w-4xl gap-6"
        aria-labelledby="admin-title"
      >
        <p className="text-sm font-bold text-teal-700 uppercase">
          Oogiri Bot Admin
        </p>
        <h1
          id="admin-title"
          className="text-balance text-3xl leading-tight font-bold text-stone-950"
        >
          ダッシュボード
        </h1>
        <Suspense fallback={<AdminDashboardMetricsSkeleton />}>
          <AdminDashboardMetrics />
        </Suspense>
      </section>
    </main>
  )
}
