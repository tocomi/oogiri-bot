import Link from 'next/link'

import { cn } from '@/lib/utils'

/** ヘッダに並べる画面 */
type AdminScreen = 'reporting' | 'users'

type AdminHeaderProps = {
  /** 現在開いている画面 */
  current: AdminScreen
  /** 画面を移っても同じ期間を見続けられるよう引き継ぐ値 */
  period: string
}

/**
 * 画面を切り替えるヘッダ
 * 期間はどの画面でも共通の見方なので、リンクに必ず引き継ぐ
 */
export function AdminHeader({ current, period }: AdminHeaderProps) {
  const links: { screen: AdminScreen; label: string; href: string }[] = [
    { screen: 'reporting', label: '集計', href: `/?period=${period}` },
    { screen: 'users', label: 'ユーザー', href: `/users?period=${period}` },
  ]

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b px-3">
      <span className="text-[13px] font-semibold">Oogiri Bot</span>

      <nav className="flex items-center gap-3" aria-label="画面">
        {links.map((link) => {
          const isCurrent = link.screen === current
          return (
            <Link
              key={link.screen}
              href={link.href}
              aria-current={isCurrent ? 'page' : undefined}
              className={cn(
                'rounded-sm text-[13px] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                isCurrent
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
