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
} from '@/features/shared/lib/adminPeriod'
import { cn } from '@/lib/utils'

type AdminPeriodSelectorProps = {
  /** 選択中の期間 */
  current: AdminPeriod
  /** 選択できる年。新しい順 */
  availableYears: number[]
  /**
   * 期間を切り替えたときの遷移先
   * 集計とユーザーで同じ選択部品を使うため、どの画面に留まるかは呼び出し側が決める
   */
  basePath: string
  /** 期間を切り替えても保持する画面固有の検索パラメータ */
  additionalQueryParams?: Readonly<Record<string, string>>
}

/**
 * 集計期間を全期間と年で切り替える
 * 状態を URL に持たせるため、切り替えは必ず period の searchParams に反映する
 */
export function AdminPeriodSelector({
  additionalQueryParams = {},
  current,
  availableYears,
  basePath,
}: AdminPeriodSelectorProps) {
  const router = useRouter()
  const isAll = current === ADMIN_ALL_PERIOD

  // Select.Value にそのまま出せるよう、表示用のラベルを添えて渡す
  const yearItems = availableYears.map((year) => ({
    value: String(year),
    label: `${year} 年`,
  }))

  const createPeriodHref = (period: string) => {
    const params = new URLSearchParams({ period })
    Object.entries(additionalQueryParams).forEach(([key, value]) => {
      params.set(key, value)
    })
    return `${basePath}?${params.toString()}`
  }

  return (
    <div className="flex items-center gap-2" role="group" aria-label="集計期間">
      <Link
        href={createPeriodHref(ADMIN_ALL_PERIOD)}
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
          router.push(createPeriodHref(value))
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
