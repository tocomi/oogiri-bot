import type { AdminSummary } from '@/features/reporting/api/adminReporting'

import { cn } from '@/lib/utils'

type Tile = {
  /** タイルの見出し */
  label: string
  /** 集計期間の実績 */
  value: number
  /** 前期からの増減。比較できる前期がなければ null */
  delta: number | null
}

/**
 * 前期比を符号つきの実数で表す
 */
const formatDelta = (delta: number) => {
  if (delta === 0) return '±0'
  return delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()
}

type AdminSummaryTilesProps = {
  summary: AdminSummary
}

/**
 * 集計期間の主要な数値を並べる
 */
export function AdminSummaryTiles({ summary }: AdminSummaryTilesProps) {
  const { current, previous } = summary

  const toTile = (label: string, key: keyof AdminSummary['current']): Tile => ({
    label,
    value: current[key],
    delta: previous === null ? null : current[key] - previous[key],
  })

  const tiles: Tile[] = [
    toTile('お題', 'odaiCount'),
    toTile('回答', 'kotaeCount'),
    toTile('投票', 'voteCount'),
    toTile('回答した人', 'kotaeUserCount'),
    toTile('投票した人', 'voteUserCount'),
  ]

  return (
    <dl
      className="grid grid-cols-2 gap-px border-b bg-border sm:grid-cols-5"
      aria-label="集計期間の実績"
    >
      {tiles.map((tile) => (
        <div key={tile.label} className="bg-background px-3 py-3">
          <dt className="text-[11px] text-muted-foreground">{tile.label}</dt>
          <dd>
            <p className="mt-1 text-xl leading-none font-semibold tabular-nums">
              {tile.value.toLocaleString()}
            </p>
            {tile.delta === null ? (
              <p className="mt-1 text-[11px] text-muted-foreground">比較なし</p>
            ) : (
              <p
                className={cn(
                  'mt-1 text-[11px] tabular-nums',
                  tile.delta > 0 && 'text-emerald-700',
                  tile.delta < 0 && 'text-destructive',
                  tile.delta === 0 && 'text-muted-foreground',
                )}
              >
                {formatDelta(tile.delta)} 前期比
              </p>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
