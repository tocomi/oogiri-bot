import type { AdminOdaiListItem } from '@/features/reporting/api/adminReporting'

import { formatAdminDate } from '@/features/reporting/lib/adminFormat'

/** グラフの最大の高さ（px） */
const MAX_BAR_HEIGHT = 96

type AdminOdaiChartProps = {
  /** 新しい順のお題 */
  items: AdminOdaiListItem[]
}

/**
 * お題ごとの回答数を棒で並べる
 * 軸やツールチップを持たない単純な形のため、ライブラリを使わず div で表す
 */
export function AdminOdaiChart({ items }: AdminOdaiChartProps) {
  if (!items.length) return null

  // 古い順に並べ直して時系列で読めるようにする
  const chronological = [...items].reverse()
  const maxCount = Math.max(...chronological.map((item) => item.kotaeCount), 1)

  const description = chronological
    .map(
      (item) => `${formatAdminDate(item.createdAt)} が ${item.kotaeCount} 件`,
    )
    .join('、')

  return (
    <section className="border-b px-3 py-3" aria-labelledby="odai-chart-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="odai-chart-title" className="text-xs font-semibold">
          お題ごとの回答数
        </h2>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          直近 {chronological.length} 回
        </span>
      </div>

      <div
        className="mt-3 flex items-end gap-2"
        role="img"
        aria-label={`お題ごとの回答数。${description}`}
      >
        {chronological.map((item, index) => (
          <div key={item.id} className="grid flex-1 gap-1">
            <span
              className={
                index === chronological.length - 1
                  ? 'text-center text-[10px] font-semibold tabular-nums'
                  : 'text-center text-[10px] text-muted-foreground tabular-nums'
              }
            >
              {item.kotaeCount}
            </span>
            <span
              className="mx-auto block w-full max-w-8 rounded-t-sm bg-primary"
              style={{
                height: `${Math.round(
                  (item.kotaeCount / maxCount) * MAX_BAR_HEIGHT,
                )}px`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex gap-2">
        {chronological.map((item) => (
          <span
            key={item.id}
            className="flex-1 text-center text-[10px] text-muted-foreground tabular-nums"
          >
            {formatAdminDate(item.createdAt)}
          </span>
        ))}
      </div>
    </section>
  )
}
