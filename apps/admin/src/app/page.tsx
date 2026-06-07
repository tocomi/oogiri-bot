import { AdminTabs } from '@/features/dashboard/components/AdminTabs'

export default function Home() {
  return (
    <main className="admin-shell">
      <section className="admin-panel" aria-labelledby="admin-title">
        <p className="admin-kicker">Oogiri Bot Admin</p>
        <h1 id="admin-title" className="admin-title">
          Console scaffold is alive.
        </h1>
        <p className="admin-copy">
          This is the smallest Next.js admin surface for the bot. Server
          Actions, Drizzle access, and authentication can be layered in from
          here without changing the app shape.
        </p>
        <AdminTabs />
      </section>
    </main>
  )
}
