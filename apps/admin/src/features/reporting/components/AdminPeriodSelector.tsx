'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ADMIN_ALL_PERIOD,
  AdminPeriod,
  formatAdminPeriodParam,
} from '@/features/reporting/lib/adminPeriod'
import { cn } from '@/lib/utils'

type AdminPeriodSelectorProps = {
  /** 選択中の期間 */
  current: AdminPeriod
  /** 選択できる年。新しい順 */
  availableYears: number[]
}

/**
 * 集計期間を全期間と年で切り替える
 * 状態を URL に持たせるため、切り替えは必ず period の searchParams に反映する
 */
export function AdminPeriodSelector({
  current,
  availableYears,
}: AdminPeriodSelectorProps) {
  const router = useRouter()
  const isAll = current === ADMIN_ALL_PERIOD

  // Select.Value にそのまま出せるよう、表示用のラベルを添えて渡す
  const yearItems = availableYears.map((year) => ({
    value: String(year),
    label: `${year} 年`,
  }))

  return (
    <div className="flex items-center gap-2" role="group" aria-label="集計期間">
      <Link
        href={`/?period=${ADMIN_ALL_PERIOD}`}
        aria-current={isAll ? 'page' : undefined}
        className={cn(
          'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
          isAll
            ? 'border-primary bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted',
        )}
      >
        全期間
      </Link>

      <Select
        items={yearItems}
        value={isAll ? null : formatAdminPeriodParam(current)}
        onValueChange={(value) => {
          if (typeof value !== 'string') return
          router.push(`/?period=${value}`)
        }}
      >
        <SelectTrigger
          size="sm"
          aria-label="年"
          disabled={availableYears.length === 0}
          className="min-w-24 text-xs"
        >
          <SelectValue placeholder="年を選ぶ" />
        </SelectTrigger>
        <SelectContent>
          {yearItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
