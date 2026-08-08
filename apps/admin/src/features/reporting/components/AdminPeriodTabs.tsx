import Link from 'next/link'

import {
  ADMIN_PERIOD_PRESETS,
  AdminPeriodPreset,
} from '@/features/reporting/lib/adminPeriod'
import { cn } from '@/lib/utils'

type AdminPeriodTabsProps = {
  /** 選択中の期間 */
  current: AdminPeriodPreset
}

/**
 * 集計期間を切り替える
 * 状態を URL に持たせるため、ボタンではなくリンクで表す
 */
export function AdminPeriodTabs({ current }: AdminPeriodTabsProps) {
  return (
    <nav
      className="flex items-center gap-0.5 rounded-md border p-0.5"
      aria-label="集計期間"
    >
      {ADMIN_PERIOD_PRESETS.map((preset) => {
        const isCurrent = preset.value === current
        return (
          <Link
            key={preset.value}
            href={`/?period=${preset.value}`}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              isCurrent
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {preset.label}
          </Link>
        )
      })}
    </nav>
  )
}
