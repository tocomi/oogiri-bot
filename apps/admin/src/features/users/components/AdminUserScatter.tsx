'use client'

import { useState } from 'react'

import type { AdminUserStatsItem } from '@/features/users/api/adminUsers'

import { formatAdminUserName } from '@/features/users/lib/adminUserFormat'
import { createAdminAxisScale } from '@/features/users/lib/adminUserScale'

/**
 * 図の座標系。実際の描画幅に関わらずこの比率を保つ
 * 横長にとって高さを抑え、管理画面の密度に合わせる
 * 横幅を実寸に近い値にしているのは、拡大で文字だけ大きくならないようにするため
 */
const VIEW_WIDTH = 1000
const VIEW_HEIGHT = 230

/** 目盛りと軸名の分だけ内側に寄せる */
const PLOT_LEFT = 34
const PLOT_RIGHT = 984
const PLOT_TOP = 16
const PLOT_BOTTOM = 190

/** 直接ラベルを付ける点の数。付けすぎると図が読めなくなる */
const LABELED_COUNT = 3

type AdminUserScatterProps = {
  /** 回答数の多い順のユーザー */
  items: AdminUserStatsItem[]
}

type PlottedUser = {
  item: AdminUserStatsItem
  /** 図の座標系での位置 */
  x: number
  y: number
}

/**
 * 直接ラベルを付ける対象を選ぶ
 * 全点に名前を出すと重なって読めないため、図の主張になる点だけに絞る
 */
const pickLabeledUserIds = (items: AdminUserStatsItem[]) => {
  if (!items.length) return new Set<string>()

  const byKotae = [...items].sort((a, b) => b.kotaeCount - a.kotaeCount)
  const byGap = [...items].sort(
    (a, b) =>
      b.voteCount - b.kotaeCount - (a.voteCount - a.kotaeCount) ||
      a.userId.localeCompare(b.userId),
  )

  // 最も書いている人と、回答と投票が最も偏っている両端
  const candidates = [byKotae[0], byGap[0], byGap.at(-1)]

  return new Set(
    candidates
      .filter((item) => item !== undefined)
      .slice(0, LABELED_COUNT)
      .map((item) => item.userId),
  )
}

/**
 * 回答数と投票数の関係を 1 枚で見せる
 * 対角線より上なら投票が多く、下なら回答が多い、という読み方をさせる
 */
export function AdminUserScatter({ items }: AdminUserScatterProps) {
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null)

  const kotaeScale = createAdminAxisScale(
    Math.max(...items.map((item) => item.kotaeCount), 0),
  )
  const voteScale = createAdminAxisScale(
    Math.max(...items.map((item) => item.voteCount), 0),
  )

  const toX = (value: number) =>
    PLOT_LEFT + (value / kotaeScale.max) * (PLOT_RIGHT - PLOT_LEFT)
  const toY = (value: number) =>
    PLOT_BOTTOM - (value / voteScale.max) * (PLOT_BOTTOM - PLOT_TOP)

  const plotted: PlottedUser[] = items.map((item) => ({
    item,
    x: toX(item.kotaeCount),
    y: toY(item.voteCount),
  }))

  const labeledUserIds = pickLabeledUserIds(items)
  const hovered = plotted.find((point) => point.item.userId === hoveredUserId)

  // 回答数 = 投票数 の線。軸の上限が違うため、両方に収まるところまで引く
  const referenceValue = Math.min(kotaeScale.max, voteScale.max)

  return (
    <div className="px-3 py-3">
      {/* ツールチップは割合で置くため、SVG と同じ大きさの箱を基準にする */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label="ユーザーごとの回答数と投票数の散布図。個々の数値は下の一覧でも読めます。"
        >
          {voteScale.ticks.map((tick) => (
            <line
              key={`grid-${tick}`}
              x1={PLOT_LEFT}
              y1={toY(tick)}
              x2={PLOT_RIGHT}
              y2={toY(tick)}
              className="stroke-border"
              strokeWidth={1}
            />
          ))}

          <line
            x1={PLOT_LEFT}
            y1={PLOT_TOP}
            x2={PLOT_LEFT}
            y2={PLOT_BOTTOM}
            className="stroke-border"
            strokeWidth={1}
          />

          <line
            x1={PLOT_LEFT}
            y1={PLOT_BOTTOM}
            x2={toX(referenceValue)}
            y2={toY(referenceValue)}
            className="stroke-border"
            strokeWidth={1}
          />

          {voteScale.ticks.map((tick) => (
            <text
              key={`tick-y-${tick}`}
              x={PLOT_LEFT - 6}
              y={toY(tick) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px]"
            >
              {tick}
            </text>
          ))}
          {kotaeScale.ticks.map((tick) => (
            <text
              key={`tick-x-${tick}`}
              x={toX(tick)}
              y={PLOT_BOTTOM + 13}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {tick}
            </text>
          ))}

          <text
            x={PLOT_LEFT}
            y={PLOT_TOP - 5}
            className="fill-muted-foreground text-[10px]"
          >
            投票数
          </text>
          <text
            x={PLOT_RIGHT}
            y={VIEW_HEIGHT - 5}
            textAnchor="end"
            className="fill-muted-foreground text-[10px]"
          >
            回答数
          </text>

          {plotted.map(({ item, x, y }) => (
            <circle
              key={`dot-${item.userId}`}
              cx={x}
              cy={y}
              r={item.userId === hoveredUserId ? 6 : 4}
              className="fill-primary stroke-background"
              strokeWidth={2}
            />
          ))}

          {plotted
            .filter(({ item }) => labeledUserIds.has(item.userId))
            .map(({ item, x, y }) => (
              <text
                key={`label-${item.userId}`}
                x={x + 8}
                y={y - 5}
                className="fill-muted-foreground text-[9px]"
              >
                {formatAdminUserName(item)}
              </text>
            ))}

          {/* 点そのものは小さいので、当たり判定を広げて狙いやすくする */}
          {plotted.map(({ item, x, y }) => (
            <circle
              key={`hit-${item.userId}`}
              cx={x}
              cy={y}
              r={11}
              tabIndex={0}
              role="button"
              aria-label={`${formatAdminUserName(item)} 回答 ${item.kotaeCount} 投票 ${item.voteCount}`}
              className="cursor-pointer fill-transparent focus-visible:outline-2 focus-visible:outline-ring"
              onMouseEnter={() => setHoveredUserId(item.userId)}
              onMouseLeave={() => setHoveredUserId(null)}
              onFocus={() => setHoveredUserId(item.userId)}
              onBlur={() => setHoveredUserId(null)}
            />
          ))}
        </svg>

        {hovered !== undefined && (
          <div
            // viewBox の比率のまま描画されるため、割合で置けば点の真上に重なる
            style={{
              left: `${(hovered.x / VIEW_WIDTH) * 100}%`,
              top: `${(hovered.y / VIEW_HEIGHT) * 100}%`,
            }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-[140%] rounded-md bg-foreground px-2 py-1 text-[11px] whitespace-nowrap text-background tabular-nums"
          >
            {formatAdminUserName(hovered.item)} · 回答 {hovered.item.kotaeCount}{' '}
            · 投票 {hovered.item.voteCount}
          </div>
        )}
      </div>
    </div>
  )
}
