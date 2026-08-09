import Link from 'next/link'

import type { AdminUserStatsItem } from '@/features/users/api/adminUsers'
import type { AdminUserSort } from '@/features/users/lib/adminUserSort'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatAdminUserName,
  formatAdminVoteRatio,
} from '@/features/users/lib/adminUserFormat'
import { cn } from '@/lib/utils'

type AdminUserBarProps = {
  /** そのユーザーの件数 */
  value: number
  /** 同じ列の最大件数。バーの長さの基準になる */
  max: number
  /** バーの色。回答・投票・出題を既存テーマの色で区別する */
  tone: 'kotae' | 'vote' | 'odai'
}

/**
 * 件数をバーと数値の組で表す
 * バーは大小の見当をつけるための補助で、値そのものは必ず数字で示す
 */
function AdminUserBar({ value, max, tone }: AdminUserBarProps) {
  // 全員 0 件の列でも幅の計算が壊れないようにする
  const ratio = max === 0 ? 0 : value / max
  const toneClass = {
    kotae: 'bg-primary',
    vote: 'bg-muted-foreground',
    odai: 'bg-chart-3',
  }[tone]

  return (
    <div className="flex items-center gap-2">
      <span className="h-2 min-w-14 flex-1 rounded-sm bg-muted">
        <span
          aria-hidden="true"
          className={cn('block h-full rounded-r-sm', toneClass)}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </span>
      <span className="w-7 shrink-0 text-right tabular-nums">{value}</span>
    </div>
  )
}

type AdminSortableHeadProps = {
  /** この見出しが並べ替える指標 */
  sort: AdminUserSort
  /** 選択中の並び */
  current: AdminUserSort
  /** 並びを変えても同じ期間に留まるための遷移先 */
  href: string
  /** 見出しの文言 */
  label: string
}

/**
 * 並べ替えられる列の見出し
 * 並びを URL に持たせるため、押した先をそのまま共有・再読み込みできるようリンクにする
 */
function AdminSortableHead({
  sort,
  current,
  href,
  label,
}: AdminSortableHeadProps) {
  const isCurrent = sort === current

  return (
    <TableHead
      className="w-[17%]"
      aria-sort={isCurrent ? 'descending' : 'none'}
    >
      <Link
        href={href}
        className={cn(
          'rounded-sm hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
          isCurrent && 'font-semibold text-foreground',
        )}
      >
        {label}
        {/* 並び替えの向きは降順だけなので、選択中かどうかだけを示す */}
        {isCurrent && <span aria-hidden="true"> ↓</span>}
      </Link>
    </TableHead>
  )
}

type AdminUserTableProps = {
  /** 表示する並びに整えたユーザー */
  items: AdminUserStatsItem[]
  /** 期間内のお題の数。参加お題の分母になる */
  odaiCount: number
  /** 選択中の並び */
  sort: AdminUserSort
  /** 並べ替えの遷移先を組み立てるための、期間を含んだ現在の URL */
  createSortHref: (sort: AdminUserSort) => string
}

/**
 * ユーザーごとの回答数・投票数・出題数を一覧する
 * 各バーの基準が別なので、見出しにそれぞれの最大値を出して長さの誤読を防ぐ
 */
export function AdminUserTable({
  items,
  odaiCount,
  sort,
  createSortHref,
}: AdminUserTableProps) {
  if (!items.length) {
    return (
      <p className="px-3 py-8 text-center text-sm text-muted-foreground">
        この期間に回答・投票・出題したユーザーはいません。
      </p>
    )
  }

  const maxKotae = Math.max(...items.map((item) => item.kotaeCount))
  const maxVote = Math.max(...items.map((item) => item.voteCount))
  const maxPostedOdai = Math.max(...items.map((item) => item.postedOdaiCount))

  return (
    <Table className="text-[13px]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 pl-3 text-right">#</TableHead>
          <TableHead className="min-w-32">ユーザー</TableHead>
          <AdminSortableHead
            sort="kotae"
            current={sort}
            href={createSortHref('kotae')}
            label={`回答（最大 ${maxKotae}）`}
          />
          <AdminSortableHead
            sort="vote"
            current={sort}
            href={createSortHref('vote')}
            label={`投票（最大 ${maxVote}）`}
          />
          <AdminSortableHead
            sort="odai"
            current={sort}
            href={createSortHref('odai')}
            label={`出題（最大 ${maxPostedOdai}）`}
          />
          <TableHead className="w-24 text-right">投票 ÷ 回答</TableHead>
          <TableHead className="w-24 pr-3 text-right">参加お題</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((item, index) => (
          <TableRow key={item.userId}>
            <TableCell className="pl-3 text-right text-[11px] text-muted-foreground tabular-nums">
              {index + 1}
            </TableCell>
            <TableCell className="max-w-0 truncate font-medium">
              {formatAdminUserName(item)}
            </TableCell>
            <TableCell>
              <AdminUserBar
                value={item.kotaeCount}
                max={maxKotae}
                tone="kotae"
              />
            </TableCell>
            <TableCell>
              <AdminUserBar value={item.voteCount} max={maxVote} tone="vote" />
            </TableCell>
            <TableCell>
              <AdminUserBar
                value={item.postedOdaiCount}
                max={maxPostedOdai}
                tone="odai"
              />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatAdminVoteRatio(item)}
            </TableCell>
            <TableCell className="pr-3 text-right tabular-nums">
              {item.kotaeOdaiCount} / {odaiCount}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
