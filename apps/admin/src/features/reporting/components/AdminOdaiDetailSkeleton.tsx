import { Separator } from '@/components/ui/separator'

/** 値が届く場所を示すバー */
function AdminSkeletonBar({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-sm bg-muted ${className}`}
    />
  )
}

/** 詳細パネルと同じ並びの見出し */
const STAT_LABELS = ['回答', '投票', '回答者', '投票者']

type AdminOdaiDetailSkeletonProps = {
  /** 一覧の行から分かっているタイトル */
  title: string
}

/**
 * 詳細が届くまでの間、ドロワーの骨格だけを先に見せる
 * 押した直後にドロワーを開くため、中身の代わりに同じ形の場所を確保する
 */
export function AdminOdaiDetailSkeleton({
  title,
}: AdminOdaiDetailSkeletonProps) {
  return (
    <div aria-busy="true" className="grid w-full min-w-0 gap-4 [&>*]:min-w-0">
      <p className="sr-only">集計を読み込んでいます</p>

      <div>
        <AdminSkeletonBar className="h-3 w-40" />
        <h2 className="mt-1.5 text-[15px] leading-snug font-semibold text-pretty">
          {title}
        </h2>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
        {STAT_LABELS.map((label) => (
          <div key={label}>
            <dt className="text-[11px] text-muted-foreground">{label}</dt>
            <dd className="mt-1">
              <AdminSkeletonBar className="h-4 w-8" />
            </dd>
          </div>
        ))}
      </dl>

      <Separator />

      {['打点王', '首位打者'].map((heading) => (
        <section key={heading}>
          <h3 className="text-xs font-semibold text-muted-foreground">
            {heading}
          </h3>
          <div className="mt-2 grid gap-1.5">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-2">
                <AdminSkeletonBar className="h-3 w-3 shrink-0" />
                <AdminSkeletonBar className="h-3 flex-1" />
                <AdminSkeletonBar className="h-3 w-8 shrink-0" />
              </div>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h3 className="text-xs font-semibold text-muted-foreground">
          票の散らばり
        </h3>
        <div className="mt-2 grid gap-1.5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-2">
              <AdminSkeletonBar className="h-3 w-16 shrink-0" />
              <AdminSkeletonBar className="h-2 flex-1" />
              <AdminSkeletonBar className="h-3 w-12 shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
