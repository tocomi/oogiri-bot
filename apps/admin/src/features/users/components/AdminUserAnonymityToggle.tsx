'use client'

import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import type { AdminUserSort } from '@/features/users/lib/adminUserSort'

import { Button } from '@/components/ui/button'
import { createAdminUserHref } from '@/features/users/lib/adminUserPrivacy'

type AdminUserAnonymityToggleProps = {
  /** 現在の集計期間 */
  period: string
  /** 現在の一覧の並び */
  sort: AdminUserSort
  /** 現在匿名モードかどうか */
  anonymous: boolean
}

/**
 * ユーザー分析だけの表示名を匿名ラベルへ切り替える
 * URL に状態を持たせ、共有・再読み込みしても同じ表示を保つ
 */
export function AdminUserAnonymityToggle({
  period,
  sort,
  anonymous,
}: AdminUserAnonymityToggleProps) {
  const router = useRouter()
  const nextHref = createAdminUserHref({
    anonymous: !anonymous,
    period,
    sort,
  })

  return (
    <Button
      type="button"
      variant={anonymous ? 'secondary' : 'outline'}
      size="sm"
      aria-pressed={anonymous}
      onClick={() => router.push(nextHref)}
    >
      {anonymous ? (
        <EyeOffIcon aria-hidden="true" />
      ) : (
        <EyeIcon aria-hidden="true" />
      )}
      {anonymous ? '匿名モード: オン' : '匿名モード: オフ'}
    </Button>
  )
}
