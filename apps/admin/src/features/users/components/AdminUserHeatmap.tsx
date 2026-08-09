import type { AdminUserMatrixOdai } from '@/features/users/api/adminUsers'

import { AdminTruncatedText } from '@/features/shared/components/AdminTruncatedText'
import { formatAdminFullDate } from '@/features/shared/lib/adminFormat'
import { createAdminHeatLevel } from '@/features/users/lib/adminUserScale'

/**
 * 名前の列幅
 * 名前の長さでセルの開始位置がずれると 2 つの面を見比べられないため、固定する
 */
const NAME_COLUMN = 'w-24'

/**
 * 濃さの段階に対応する色
 * 動的に組み立てると Tailwind が拾えないため、完成したクラス名で持つ
 */
const HEAT_TONES = [
  'bg-muted',
  'bg-primary/20',
  'bg-primary/45',
  'bg-primary/70',
  'bg-primary',
]

export type AdminHeatRow = {
  /** Slack のユーザー ID */
  userId: string
  /** 行の見出しに出す名前 */
  name: string
  /** odaiList と同じ並びの回答数 */
  kotaeCounts: number[]
  /** odaiList と同じ並びの投票数 */
  voteCounts: number[]
}

type AdminHeatFacetProps = {
  /** 面の見出し */
  title: string
  /** 列に並ぶお題。古い順 */
  odaiList: AdminUserMatrixOdai[]
  /** 行と、その行の件数 */
  rows: { row: AdminHeatRow; counts: number[] }[]
  /** セルの単位。ツールチップの文言に使う */
  unit: string
}

/**
 * お題 × ユーザーの件数を濃さで表す 1 面
 * 濃さは相対値なので、正確な件数は行末の合計とセルのツールチップで補う
 *
 * 回答と投票では多い人の顔ぶれが違うため、面ごとにその面の合計で並べ替える。
 * その面で 1 件もない人は行だけが残っても読めないので落とす。
 */
function AdminHeatFacet({ title, odaiList, rows, unit }: AdminHeatFacetProps) {
  const visibleRows = rows
    .map(({ row, counts }) => ({
      row,
      counts,
      total: counts.reduce((sum, count) => sum + count, 0),
    }))
    .filter(({ total }) => total > 0)
    .sort(
      (a, b) => b.total - a.total || a.row.userId.localeCompare(b.row.userId),
    )

  if (!visibleRows.length) {
    return (
      <section>
        <h3 className="mb-1.5 text-[11px] text-muted-foreground">{title}</h3>
        <p className="text-[12px] text-muted-foreground">
          この期間に{title}した人はいません。
        </p>
      </section>
    )
  }

  const maxCount = Math.max(...visibleRows.flatMap(({ counts }) => counts))

  return (
    <section>
      <h3 className="mb-1.5 text-[11px] text-muted-foreground">{title}</h3>

      <table className="w-auto border-separate border-spacing-0.5 text-[11px]">
        <thead>
          <tr>
            <th
              className={`sticky left-0 z-1 bg-background pr-2 ${NAME_COLUMN}`}
            />
            {odaiList.map((odai, index) => (
              <th
                key={odai.id}
                title={`${odai.title}（${formatAdminFullDate(odai.createdAt)}）`}
                className="w-[18px] text-center text-[10px] font-medium text-muted-foreground"
              >
                {index + 1}
              </th>
            ))}
            <th className="pl-2 text-right text-[10px] font-medium text-muted-foreground">
              計
            </th>
          </tr>
        </thead>

        <tbody>
          {visibleRows.map(({ row, counts, total }) => (
            <tr key={row.userId}>
              <th
                scope="row"
                className="sticky left-0 z-1 bg-background pr-2 text-left font-medium"
              >
                <AdminTruncatedText
                  className={`text-[12px] ${NAME_COLUMN}`}
                  text={row.name}
                />
              </th>
              {counts.map((count, index) => {
                const odai = odaiList[index]
                return (
                  <td key={odai.id}>
                    <div
                      title={`${row.name} · ${odai.title} · ${count} ${unit}`}
                      className={`h-[18px] w-[18px] rounded-[3px] ${HEAT_TONES[createAdminHeatLevel(count, maxCount)]}`}
                    />
                  </td>
                )
              })}
              <td className="pl-2 text-right text-[12px] tabular-nums">
                {total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

type AdminUserHeatmapProps = {
  /** 列に並ぶお題。古い順 */
  odaiList: AdminUserMatrixOdai[]
  /** 絞り込む前のお題の総数 */
  totalOdaiCount: number
  /** 表示するユーザー。並びと絞り込みは面ごとにこの中で決める */
  rows: AdminHeatRow[]
}

/**
 * お題ごとの参加を回答と投票の 2 面で表す
 * 合計だけでは見えない「いつ参加していて、いつ止まったか」を追うために使う
 */
export function AdminUserHeatmap({
  odaiList,
  totalOdaiCount,
  rows,
}: AdminUserHeatmapProps) {
  if (!odaiList.length || !rows.length) {
    return (
      <p className="px-3 py-8 text-center text-sm text-muted-foreground">
        この期間に集計できるお題がありません。
      </p>
    )
  }

  const isTruncated = totalOdaiCount > odaiList.length

  return (
    <div className="grid gap-4 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-[11px] text-muted-foreground">
          左が古いお題、右が新しいお題。行はその面の件数が多い順
        </p>
        {/* 黙って切り詰めると全部見えているように読めるため、絞ったことを必ず出す */}
        {isTruncated && (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            全 {totalOdaiCount} 件中 直近 {odaiList.length} 件
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="grid w-max gap-5">
          <AdminHeatFacet
            title="回答"
            odaiList={odaiList}
            rows={rows.map((row) => ({ row, counts: row.kotaeCounts }))}
            unit="回答"
          />
          <AdminHeatFacet
            title="投票"
            odaiList={odaiList}
            rows={rows.map((row) => ({ row, counts: row.voteCounts }))}
            unit="票"
          />
        </div>
      </div>
    </div>
  )
}
