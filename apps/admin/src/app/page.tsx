const adminSections = [
  {
    title: "Odai",
    description: "Create and review prompts for Slack games.",
  },
  {
    title: "Kotae",
    description: "Inspect answers before moderation tools arrive.",
  },
  {
    title: "Results",
    description: "Keep a place for vote summaries and AI reviews.",
  },
];

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
        <div className="admin-grid" aria-label="Planned admin sections">
          {adminSections.map((section) => (
            <article className="admin-cell" key={section.title}>
              <strong>{section.title}</strong>
              <span>{section.description}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
