type AdminMetricCardProps = {
  title: string
  value: number | string
}

const metricCardClassName =
  'grid min-h-32 min-w-40 flex-1 gap-5 border border-t-4 border-stone-300 bg-white p-5 shadow-md'

export function AdminMetricCard({ title, value }: AdminMetricCardProps) {
  return (
    <article className={`${metricCardClassName} border-t-teal-600`}>
      <h2 className="text-balance text-sm font-bold text-stone-600">{title}</h2>
      <p className="text-right font-mono text-5xl leading-none font-bold text-stone-950 tabular-nums">
        {value}
      </p>
    </article>
  )
}

export function AdminMetricCardSkeleton({
  title,
}: Pick<AdminMetricCardProps, 'title'>) {
  return (
    <article className={`${metricCardClassName} border-t-stone-400`}>
      <h2 className="text-balance text-sm font-bold text-stone-500">{title}</h2>
      <div className="flex justify-end" aria-hidden="true">
        <div className="h-12 w-24 animate-pulse rounded-md bg-stone-200" />
      </div>
    </article>
  )
}
