import type { AdminUserStats } from '@/features/users/api/adminUsers'

type AdminUserSummaryTilesProps = {
  stats: AdminUserStats
}

/**
 * ユーザー軸で見たときの全体像を並べる
 * 期間内の数値はすべて一覧と同じ取得結果から出すため、追加の問い合わせはしない
 */
export function AdminUserSummaryTiles({ stats }: AdminUserSummaryTilesProps) {
  const { items, odaiCount } = stats

  const kotaeCount = items.reduce((total, item) => total + item.kotaeCount, 0)
  const voteCount = items.reduce((total, item) => total + item.voteCount, 0)

  const tiles = [
    { label: '参加者', value: items.length.toLocaleString() },
    { label: 'お題', value: odaiCount.toLocaleString() },
    { label: '回答', value: kotaeCount.toLocaleString() },
    { label: '投票', value: voteCount.toLocaleString() },
  ]

  return (
    <dl
      className="grid grid-cols-2 gap-px border-b bg-border sm:grid-cols-4"
      aria-label="集計期間の実績"
    >
      {tiles.map((tile) => (
        <div key={tile.label} className="bg-background px-3 py-3">
          <dt className="text-[11px] text-muted-foreground">{tile.label}</dt>
          <dd className="mt-1 text-xl leading-none font-semibold">
            {tile.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
