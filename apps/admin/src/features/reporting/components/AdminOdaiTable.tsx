import Link from 'next/link'

import type { AdminOdaiListItem } from '@/features/reporting/api/adminReporting'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatAdminDate } from '@/features/reporting/lib/adminFormat'
import { cn } from '@/lib/utils'

import { AdminOdaiStatusBadge } from './AdminOdaiStatusBadge'

type AdminOdaiTableProps = {
  /** 新しい順のお題 */
  items: AdminOdaiListItem[]
  /** 詳細ペインで開いているお題 */
  selectedOdaiId: string | null
  /** 行のリンクに引き継ぐ期間 */
  period: string
}

/**
 * お題ごとの数値を一覧する
 * 行を選ぶと詳細ペインが切り替わるため、タイトルをリンクにする
 */
export function AdminOdaiTable({
  items,
  selectedOdaiId,
  period,
}: AdminOdaiTableProps) {
  if (!items.length) {
    return (
      <p className="px-3 py-8 text-center text-sm text-muted-foreground">
        この期間に作られたお題はありません。
      </p>
    )
  }

  return (
    <Table className="text-[13px]">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-72 pl-3">お題</TableHead>
          <TableHead className="w-20">状態</TableHead>
          <TableHead className="w-24 text-right">発表</TableHead>
          <TableHead className="w-14 text-right">回答</TableHead>
          <TableHead className="w-14 text-right">投票</TableHead>
          <TableHead className="w-16 text-right">回答者</TableHead>
          <TableHead className="w-16 pr-3 text-right">投票者</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((item) => {
          const isSelected = item.id === selectedOdaiId
          return (
            <TableRow
              key={item.id}
              data-state={isSelected ? 'selected' : undefined}
              className={cn(
                isSelected && 'shadow-[inset_2px_0_0_0_var(--primary)]',
              )}
            >
              <TableCell className="max-w-0 truncate pl-3">
                <Link
                  href={`/?period=${period}&odaiId=${encodeURIComponent(item.id)}`}
                  className={cn(
                    'block truncate rounded-sm hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                    isSelected && 'font-semibold',
                  )}
                >
                  {item.title}
                </Link>
              </TableCell>
              <TableCell>
                <AdminOdaiStatusBadge status={item.status} />
              </TableCell>
              <TableCell className="text-right text-[11px] tabular-nums">
                {item.publishedAt === null
                  ? '—'
                  : formatAdminDate(item.publishedAt)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {item.kotaeCount}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {item.voteCount}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {item.kotaeUserCount}
              </TableCell>
              <TableCell className="pr-3 text-right tabular-nums">
                {item.voteUserCount}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
