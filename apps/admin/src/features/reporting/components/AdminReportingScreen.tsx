import {
  getAdminOdaiDetail,
  getAdminOdaiList,
  getAdminSummary,
} from '@/features/reporting/api/adminReporting'
import { formatAdminFullDate } from '@/features/reporting/lib/adminFormat'
import {
  AdminPeriodPreset,
  createAdminPeriodRange,
} from '@/features/reporting/lib/adminPeriod'

import { AdminOdaiChart } from './AdminOdaiChart'
import { AdminOdaiDetailDrawer } from './AdminOdaiDetailDrawer'
import { AdminOdaiDetailPanel } from './AdminOdaiDetailPanel'
import { AdminOdaiTable } from './AdminOdaiTable'
import { AdminPeriodTabs } from './AdminPeriodTabs'
import { AdminSummaryTiles } from './AdminSummaryTiles'

/** 一覧とグラフに載せるお題の件数 */
const ODAI_LIMIT = 12

type AdminReportingScreenProps = {
  /** 表示する期間 */
  period: AdminPeriodPreset
  /** ドロワーで開くお題。未選択なら null */
  odaiId: string | null
}

/**
 * 集計画面の本体
 * 期間と開いているお題は URL から受け取り、この階層でまとめて取得する
 */
export async function AdminReportingScreen({
  period,
  odaiId,
}: AdminReportingScreenProps) {
  const range = createAdminPeriodRange(period, Date.now())

  const [summary, odaiList] = await Promise.all([
    getAdminSummary(range),
    getAdminOdaiList({ ...range, limit: ODAI_LIMIT }),
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
        <AdminPeriodTabs current={period} />
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {period === 'all'
            ? `${formatAdminFullDate(range.to)} まで`
            : `${formatAdminFullDate(range.from)} – ${formatAdminFullDate(range.to)}`}
        </span>
      </div>

      <main className="min-w-0 flex-1">
        <AdminSummaryTiles summary={summary} />
        <AdminOdaiChart items={odaiList.items} />
        <AdminOdaiTable
          items={odaiList.items}
          selectedOdaiId={selected?.id ?? null}
          period={period}
        />
      </main>

      <AdminOdaiDetailDrawer
        open={detail !== null}
        closeHref={`/?period=${period}`}
        title={detail?.title ?? ''}
      >
        {detail && <AdminOdaiDetailPanel detail={detail} />}
      </AdminOdaiDetailDrawer>
    </div>
  )
}
