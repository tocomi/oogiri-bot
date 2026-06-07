import { AdminTabs } from '@/features/dashboard/components/AdminTabs'

export default function Home() {
  return (
    <main className="min-h-screen p-6 sm:p-10">
      <section className="grid max-w-4xl gap-6" aria-labelledby="admin-title">
        <p className="text-sm font-bold text-teal-700 uppercase">
          Oogiri Bot Admin
        </p>
        <h1
          id="admin-title"
          className="max-w-3xl text-5xl leading-none font-bold tracking-normal text-stone-950 sm:text-7xl"
        >
          Console scaffold is alive.
        </h1>
        <p className="max-w-xl text-base leading-7 text-stone-600">
          This is the smallest Next.js admin surface for the bot. Server
          Actions, Drizzle access, and authentication can be layered in from
          here without changing the app shape.
        </p>
        <AdminTabs />
      </section>
    </main>
  )
}
