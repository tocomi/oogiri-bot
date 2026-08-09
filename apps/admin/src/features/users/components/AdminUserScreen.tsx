import { Suspense } from 'react'

import type {
  AdminUserMatrix,
  AdminUserStatsItem,
} from '@/features/users/api/adminUsers'

import { getAdminAvailableYears } from '@/features/shared/api/adminYears'
import { AdminHeader } from '@/features/shared/components/AdminHeader'
import { AdminPeriodSelector } from '@/features/shared/components/AdminPeriodSelector'
import { truncateAdminNow } from '@/features/shared/lib/adminCache'
import { formatAdminFullDate } from '@/features/shared/lib/adminFormat'
import {
  ADMIN_ALL_PERIOD,
  createAdminPeriodRange,
  formatAdminPeriodParam,
  parseAdminPeriod,
} from '@/features/shared/lib/adminPeriod'
import {
  getAdminUserMatrix,
  getAdminUserStats,
} from '@/features/users/api/adminUsers'
import { formatAdminUserName } from '@/features/users/lib/adminUserFormat'
import {
  AdminUserSort,
  parseAdminUserSort,
  sortAdminUsers,
} from '@/features/users/lib/adminUserSort'

import { AdminUserHeatmap } from './AdminUserHeatmap'
import { AdminUserHeatmapSkeleton } from './AdminUserHeatmapSkeleton'
import { AdminUserScatter } from './AdminUserScatter'
import { AdminUserSummaryTiles } from './AdminUserSummaryTiles'
import { AdminUserTable } from './AdminUserTable'

type AdminSectionBarProps = {
  /** 節の見出し */
  title: string
  /** 見出しの右に添える読み方の補足 */
  hint?: string
}

/** 節の切れ目を示す帯 */
function AdminSectionBar({ title, hint }: AdminSectionBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-3 py-2">
      <h2 className="text-xs font-semibold">{title}</h2>
      {hint !== undefined && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

type AdminUserHeatmapContentProps = {
  /** 一覧と並行して投げたヒートマップの取得 */
  matrix: Promise<AdminUserMatrix | null>
  /** 表示名を引くための一覧。行の並びはヒートマップが面ごとに決める */
  items: AdminUserStatsItem[]
}

/**
 * ヒートマップが届いてから中身を描く
 * 一覧の描画をヒートマップの到着で待たせないよう、Suspense の内側で解決させる
 */
async function AdminUserHeatmapContent({
  matrix,
  items,
}: AdminUserHeatmapContentProps) {
  const resolved = await matrix

  if (resolved === null) {
    return (
      <p className="px-3 py-8 text-center text-sm text-muted-foreground">
        お題ごとの集計を取得できませんでした。
      </p>
    )
  }

  const rowByUserId = new Map(resolved.rows.map((row) => [row.userId, row]))
  const emptyCounts = resolved.odaiList.map(() => 0)

  // 表示名を添える。表示中のお題では活動がない人もいるため 0 で埋める
  // 0 だけの行はヒートマップ側で落ちるので、ここでは絞り込まない
  const rows = items.map((item) => {
    const row = rowByUserId.get(item.userId)
    return {
      userId: item.userId,
      name: formatAdminUserName(item),
      kotaeCounts: row?.kotaeCounts ?? emptyCounts,
      voteCounts: row?.voteCounts ?? emptyCounts,
    }
  })

  return (
    <AdminUserHeatmap
      odaiList={resolved.odaiList}
      totalOdaiCount={resolved.totalOdaiCount}
      rows={rows}
    />
  )
}

type AdminUserScreenProps = {
  /** searchParams で指定された期間。未指定なら null */
  periodParam: string | null
  /** searchParams で指定された一覧の並び。未指定なら null */
  sortParam: string | null
}

/**
 * ユーザー別の分布画面の本体
 * 俯瞰から個別へ読ませるため、散布図・一覧・ヒートマップの順に並べる
 */
export async function AdminUserScreen({
  periodParam,
  sortParam,
}: AdminUserScreenProps) {
  // 選べる年が決まらないと期間を確定できないため、先に取得する
  const { years } = await getAdminAvailableYears()

  const period = parseAdminPeriod(periodParam, years)
  const periodValue = formatAdminPeriodParam(period)
  const range = createAdminPeriodRange(period, truncateAdminNow(Date.now()))

  // ヒートマップは一覧より重いため、待たずに投げて画面上部を先に出す
  // 失敗しても画面は出したいので、ここでは解決させない
  const matrixPromise = getAdminUserMatrix(range).catch(() => null)

  const stats = await getAdminUserStats(range)

  const sort = parseAdminUserSort(sortParam)
  const sortedItems = sortAdminUsers(stats.items, sort)
  const createSortHref = (next: AdminUserSort) =>
    `/users?period=${periodValue}&sort=${next}`

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <AdminHeader current="users" period={periodValue} />

      <div className="flex flex-wrap items-center gap-3 border-b px-3 py-2">
        <AdminPeriodSelector
          current={period}
          availableYears={years}
          basePath="/users"
        />
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {period === ADMIN_ALL_PERIOD
            ? `${formatAdminFullDate(range.to)} まで`
            : `${formatAdminFullDate(range.from)} – ${formatAdminFullDate(range.to)}`}
        </span>
      </div>

      <main className="min-w-0 flex-1 pb-6">
        <AdminUserSummaryTiles stats={stats} />

        {stats.items.length > 0 && (
          <>
            <AdminSectionBar
              title="回答数 × 投票数（1 点 = 1 ユーザー）"
              hint="対角線より上 = 投票が多い / 下 = 回答が多い"
            />
            <AdminUserScatter items={stats.items} />
          </>
        )}

        <AdminSectionBar
          title="ユーザー別の回答・投票"
          hint="回答か投票の見出しを押すと並べ替わる"
        />
        <AdminUserTable
          items={sortedItems}
          odaiCount={stats.odaiCount}
          sort={sort}
          createSortHref={createSortHref}
        />

        <AdminSectionBar title="お題ごとの回答数と投票数" />
        <Suspense
          fallback={<AdminUserHeatmapSkeleton userCount={stats.items.length} />}
        >
          <AdminUserHeatmapContent matrix={matrixPromise} items={stats.items} />
        </Suspense>
      </main>
    </div>
  )
}
