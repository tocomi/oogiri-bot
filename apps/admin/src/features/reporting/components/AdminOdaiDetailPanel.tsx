import type {
  AdminOdaiDetail,
  AdminRankedKotae,
} from '@/features/reporting/api/adminReporting'

import { Separator } from '@/components/ui/separator'
import {
  formatAdminDateTime,
  formatAdminFullDate,
} from '@/features/reporting/lib/adminFormat'

import { AdminOdaiStatusBadge } from './AdminOdaiStatusBadge'
import { AdminTruncatedText } from './AdminTruncatedText'

type RankingProps = {
  /** 見出し */
  title: string
  /** 表示する順位 */
  ranking: AdminRankedKotae[]
}

/**
 * 順位を内容・回答者・点数の並びで表す
 * 回答者は発表済みのお題でしか付かないため、ない場合は列ごと省く
 */
function AdminRanking({ title, ranking }: RankingProps) {
  if (!ranking.length) return null

  return (
    <section>
      <h3 className="text-xs font-semibold">{title}</h3>
      <ol className="mt-2 grid gap-1.5 [&>li]:min-w-0">
        {ranking.map((kotae) => (
          <li key={kotae.kotaeId} className="flex items-baseline gap-2">
            <span className="w-3 shrink-0 text-[11px] text-muted-foreground tabular-nums">
              {kotae.rank}
            </span>
            <AdminTruncatedText className="flex-1" text={kotae.content} />
            {kotae.authorName !== null && (
              // NOTE: 表示名の長さで回答の幅が変わらないよう、領域を固定して省略する
              <AdminTruncatedText
                className="w-20 shrink-0 text-right text-[11px] text-muted-foreground"
                text={kotae.authorName}
              />
            )}
            <span className="w-8 shrink-0 text-right font-semibold tabular-nums">
              {kotae.point}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

type AdminVoteDistributionProps = {
  distribution: AdminOdaiDetail['voteDistribution']
}

/**
 * 票がどこに集まったかを実数で表す
 * バーは内訳の見た目を助けるだけで、数値そのものは票数で示す
 */
function AdminVoteDistribution({ distribution }: AdminVoteDistributionProps) {
  const total =
    distribution.top3 + distribution.rank4to10 + distribution.rest || 1

  const rows = [
    { label: '上位 3 件', value: distribution.top3, tone: 'bg-primary' },
    {
      label: '4–10 位',
      value: distribution.rank4to10,
      tone: 'bg-muted-foreground',
    },
    { label: '11 位以下', value: distribution.rest, tone: 'bg-border' },
  ]

  return (
    <section>
      <h3 className="text-xs font-semibold">票の散らばり</h3>
      <div className="mt-2 grid gap-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[11px] text-muted-foreground">
              {row.label}
            </span>
            <span className="h-2 flex-1 rounded-sm bg-muted">
              <span
                className={`block h-full rounded-sm ${row.tone}`}
                style={{ width: `${Math.round((row.value / total) * 100)}%` }}
              />
            </span>
            <span className="w-12 shrink-0 text-right text-[11px] tabular-nums">
              {row.value} 票
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

type AdminOdaiDetailPanelProps = {
  detail: AdminOdaiDetail
}

/**
 * 選択したお題の集計と順位を表示する
 */
export function AdminOdaiDetailPanel({ detail }: AdminOdaiDetailPanelProps) {
  const stats = [
    { label: '回答', value: detail.kotaeCount },
    { label: '投票', value: detail.voteCount },
    { label: '回答者', value: detail.kotaeUserCount },
    { label: '投票者', value: detail.voteUserCount },
  ]

  return (
    <div className="grid w-full min-w-0 gap-4 [&>*]:min-w-0">
      <div>
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
          {detail.publishedAt === null
            ? `締切 ${formatAdminDateTime(detail.dueDate)}`
            : `${formatAdminFullDate(detail.publishedAt)} 発表`}
          <AdminOdaiStatusBadge status={detail.status} />
        </p>
        <h2 className="mt-1 text-[15px] leading-snug font-semibold text-pretty">
          {detail.title}
        </h2>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-[11px] text-muted-foreground">{stat.label}</dt>
            <dd className="mt-0.5 text-lg leading-none font-semibold tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <Separator />

      <AdminRanking title="打点王" ranking={detail.pointRanking} />
      <AdminRanking title="首位打者" ranking={detail.countRanking} />

      {detail.publishedAt === null && (
        <p className="text-[11px] text-muted-foreground">
          順位は締切時点の暫定です。
        </p>
      )}

      <AdminVoteDistribution distribution={detail.voteDistribution} />
    </div>
  )
}
