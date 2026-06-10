import { AdminMetricCard } from '@/features/dashboard/components/AdminMetricCard'

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
        <div className="flex flex-wrap gap-1">
          <AdminMetricCard title="お題の数" value={0} />
          <AdminMetricCard title="答えの数" value={0} />
          <AdminMetricCard title="投票の数" value={0} />
        </div>
      </section>
    </main>
  )
}
