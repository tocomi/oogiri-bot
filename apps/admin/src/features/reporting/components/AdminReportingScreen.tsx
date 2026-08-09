import { Suspense } from 'react'

import type { AdminOdaiDetail } from '@/features/reporting/api/adminReporting'

import {
  getAdminOdaiDetail,
  getAdminOdaiList,
  getAdminSummary,
} from '@/features/reporting/api/adminReporting'
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

import { AdminOdaiDetailDrawer } from './AdminOdaiDetailDrawer'
import { AdminOdaiDetailPanel } from './AdminOdaiDetailPanel'
import { AdminOdaiDetailSkeleton } from './AdminOdaiDetailSkeleton'
import { AdminOdaiSelectionProvider } from './AdminOdaiSelection'
import { AdminOdaiTable } from './AdminOdaiTable'
import { AdminSummaryTiles } from './AdminSummaryTiles'

type AdminOdaiDetailContentProps = {
  /** 一覧と並行して投げた詳細の取得 */
  detail: Promise<AdminOdaiDetail | null>
}

/**
 * 詳細が届いてからドロワーの中身を描く
 * 一覧の描画を詳細の到着で待たせないよう、Suspense の内側で解決させる
 */
async function AdminOdaiDetailContent({ detail }: AdminOdaiDetailContentProps) {
  const resolved = await detail

  if (resolved === null) {
    return (
      <p className="text-sm text-muted-foreground">
        このお題の集計を取得できませんでした。
      </p>
    )
  }

  return <AdminOdaiDetailPanel detail={resolved} />
}

type AdminReportingScreenProps = {
  /** searchParams で指定された期間。未指定なら null */
  periodParam: string | null
  /** ドロワーで開くお題。未選択なら null */
  odaiId: string | null
}

/**
 * 集計画面の本体
 * 期間と開いているお題は URL から受け取り、この階層でまとめて取得する
 */
export async function AdminReportingScreen({
  periodParam,
  odaiId,
}: AdminReportingScreenProps) {
  // お題 ID だけで引けるため、期間の確定を待たずに投げて往復を重ねない
  // 待たせない代わりにここでは解決させず、失敗しても画面は出す
  const detailPromise =
    odaiId === null ? null : getAdminOdaiDetail(odaiId).catch(() => null)

  // 選べる年が決まらないと期間を確定できないため、先に取得する
  const { years } = await getAdminAvailableYears()

  const period = parseAdminPeriod(periodParam, years)
  const periodValue = formatAdminPeriodParam(period)
  const range = createAdminPeriodRange(period, truncateAdminNow(Date.now()))

  const [summary, odaiList] = await Promise.all([
    getAdminSummary(range),
    getAdminOdaiList(range),
  ])

  // 期間外の ID を渡された場合は開かない
  const selected = odaiList.items.find((item) => item.id === odaiId) ?? null

  return (
    <AdminOdaiSelectionProvider
      selectedOdai={
        selected === null ? null : { id: selected.id, title: selected.title }
      }
      closeHref={`/?period=${periodValue}`}
    >
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <AdminHeader current="reporting" period={periodValue} />

        <div className="flex flex-wrap items-center gap-3 border-b px-3 py-2">
          <AdminPeriodSelector
            current={period}
            availableYears={years}
            basePath="/"
          />
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {period === ADMIN_ALL_PERIOD
              ? `${formatAdminFullDate(range.to)} まで`
              : `${formatAdminFullDate(range.from)} – ${formatAdminFullDate(range.to)}`}
          </span>
        </div>

        <main className="min-w-0 flex-1 pb-6">
          <AdminSummaryTiles summary={summary} />
          <AdminOdaiTable items={odaiList.items} period={periodValue} />
        </main>

        <AdminOdaiDetailDrawer>
          {selected !== null && detailPromise !== null && (
            <Suspense
              key={selected.id}
              fallback={<AdminOdaiDetailSkeleton title={selected.title} />}
            >
              <AdminOdaiDetailContent detail={detailPromise} />
            </Suspense>
          )}
        </AdminOdaiDetailDrawer>
      </div>
    </AdminOdaiSelectionProvider>
  )
}
