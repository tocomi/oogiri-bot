import {
  getAdminAvailableYears,
  getAdminOdaiDetail,
  getAdminOdaiList,
  getAdminSummary,
} from '@/features/reporting/api/adminReporting'
import { formatAdminFullDate } from '@/features/reporting/lib/adminFormat'
import {
  ADMIN_ALL_PERIOD,
  createAdminPeriodRange,
  formatAdminPeriodParam,
  parseAdminPeriod,
} from '@/features/reporting/lib/adminPeriod'

import { AdminOdaiDetailDrawer } from './AdminOdaiDetailDrawer'
import { AdminOdaiDetailPanel } from './AdminOdaiDetailPanel'
import { AdminOdaiTable } from './AdminOdaiTable'
import { AdminPeriodSelector } from './AdminPeriodSelector'
import { AdminSummaryTiles } from './AdminSummaryTiles'

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
  // 選べる年が決まらないと期間を確定できないため、先に取得する
  const { years } = await getAdminAvailableYears()

  const period = parseAdminPeriod(periodParam, years)
  const periodValue = formatAdminPeriodParam(period)
  const range = createAdminPeriodRange(period, Date.now())

  const [summary, odaiList] = await Promise.all([
    getAdminSummary(range),
    getAdminOdaiList(range),
  ])

  // 期間外の ID を渡された場合は開かない
  const selected = odaiList.items.find((item) => item.id === odaiId) ?? null
  const detail = selected ? await getAdminOdaiDetail(selected.id) : null

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b px-3">
        <span className="text-[13px] font-semibold">Oogiri Bot</span>
        <span className="text-[13px] text-muted-foreground">集計</span>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b px-3 py-2">
        <AdminPeriodSelector current={period} availableYears={years} />
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {period === ADMIN_ALL_PERIOD
            ? `${formatAdminFullDate(range.to)} まで`
            : `${formatAdminFullDate(range.from)} – ${formatAdminFullDate(range.to)}`}
        </span>
      </div>

      <main className="min-w-0 flex-1 pb-6">
        <AdminSummaryTiles summary={summary} />
        <AdminOdaiTable
          items={odaiList.items}
          selectedOdaiId={selected?.id ?? null}
          period={periodValue}
        />
      </main>

      <AdminOdaiDetailDrawer
        open={detail !== null}
        closeHref={`/?period=${periodValue}`}
        title={detail?.title ?? ''}
      >
        {detail && <AdminOdaiDetailPanel detail={detail} />}
      </AdminOdaiDetailDrawer>
    </div>
  )
}
