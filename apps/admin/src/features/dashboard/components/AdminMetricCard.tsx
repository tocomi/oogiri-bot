type AdminMetricCardProps = {
  title: string
  value: number | string
}

export function AdminMetricCard({ title, value }: AdminMetricCardProps) {
  return (
    <article className="grid min-h-32 min-w-40 flex-1 gap-5 border border-t-4 border-stone-300 border-t-teal-600 bg-white p-5 shadow-md">
      <h2 className="text-balance text-sm font-bold text-stone-600">
        {title}
      </h2>
      <p className="text-right font-mono text-5xl leading-none font-bold text-stone-950 tabular-nums">
        {value}
      </p>
    </article>
  )
}
