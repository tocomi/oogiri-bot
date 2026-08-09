/** 骨格に並べるセルの数。実データの列数とは無関係の目安 */
const SKELETON_COLUMNS = 15

type AdminUserHeatmapSkeletonProps = {
  /** 一覧から分かっている参加者の数。行数を実際に近づけるために使う */
  userCount: number
}

/**
 * ヒートマップが届くまでの間、同じ形の場所を確保する
 * 一覧より重い取得なので、届くまで画面下が空にならないようにする
 */
export function AdminUserHeatmapSkeleton({
  userCount,
}: AdminUserHeatmapSkeletonProps) {
  const rows = Array.from({ length: Math.min(userCount, 8) }, (_, i) => i)
  const columns = Array.from({ length: SKELETON_COLUMNS }, (_, i) => i)

  return (
    <div aria-busy="true" className="grid gap-4 px-3 py-3">
      <p className="sr-only">お題ごとの集計を読み込んでいます</p>

      {['回答', '投票'].map((title) => (
        <section key={title}>
          <h3 className="mb-1.5 text-[11px] text-muted-foreground">{title}</h3>
          <div className="grid gap-0.5">
            {rows.map((row) => (
              <div key={row} className="flex items-center gap-0.5">
                <span
                  aria-hidden="true"
                  className="mr-1.5 h-3 w-20 animate-pulse rounded-sm bg-muted"
                />
                {columns.map((column) => (
                  <span
                    key={column}
                    aria-hidden="true"
                    className="h-[18px] w-[18px] animate-pulse rounded-[3px] bg-muted"
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
