import type {
  AdminActiveOdai,
  AdminActiveOdaiOverview,
} from '@/features/dashboard/api/adminActiveOdai'
import {
  formatAdminDateTime,
  getOdaiStatusBadgeClassName,
  getOdaiStatusLabel,
} from '@/features/dashboard/lib/adminActiveOdaiDisplay'

const panelClassName =
  'grid gap-5 border border-t-4 border-stone-300 bg-white p-5 shadow-md'

type AdminActiveOdaiDetailProps = {
  odai: AdminActiveOdai
}

/**
 * アクティブなお題の詳細を表示する
 */
export function AdminActiveOdaiDetail({ odai }: AdminActiveOdaiDetailProps) {
  return (
    <article
      className={`${panelClassName} border-t-teal-600`}
      aria-labelledby="active-odai-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2">
          <p className="text-sm font-bold text-stone-600">現在のお題</p>
          <h2
            id="active-odai-title"
            className="text-pretty text-2xl leading-snug font-bold text-stone-950"
          >
            {odai.title}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${getOdaiStatusBadgeClassName(odai.status)}`}
        >
          {getOdaiStatusLabel(odai.status)}
        </span>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <dt className="text-sm font-bold text-stone-600">締切</dt>
          <dd className="font-mono text-lg font-bold text-stone-950 tabular-nums">
            <time dateTime={new Date(odai.dueDate).toISOString()}>
              {formatAdminDateTime(odai.dueDate)}
            </time>
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm font-bold text-stone-600">作成日時</dt>
          <dd className="font-mono text-lg font-bold text-stone-950 tabular-nums">
            <time dateTime={new Date(odai.createdAt).toISOString()}>
              {formatAdminDateTime(odai.createdAt)}
            </time>
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm font-bold text-stone-600">回答数</dt>
          <dd className="font-mono text-3xl leading-none font-bold text-stone-950 tabular-nums">
            {odai.kotaeCount}
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm font-bold text-stone-600">投票数</dt>
          <dd className="font-mono text-3xl leading-none font-bold text-stone-950 tabular-nums">
            {odai.voteCount}
          </dd>
        </div>
      </dl>
    </article>
  )
}

/**
 * アクティブなお題がないときの空状態を表示する
 */
export function AdminActiveOdaiEmptyState() {
  return (
    <section
      className={`${panelClassName} border-t-stone-400`}
      aria-label="現在のお題"
    >
      <p className="text-sm font-bold text-stone-600">現在のお題</p>
      <p className="text-pretty text-base leading-relaxed text-stone-700">
        現在アクティブなお題はありません。
      </p>
    </section>
  )
}

type AdminActiveOdaiPanelProps = {
  overview: AdminActiveOdaiOverview
}

/**
 * アクティブお題 API の結果を管理画面向けに描画する
 */
export function AdminActiveOdaiPanel({ overview }: AdminActiveOdaiPanelProps) {
  if (!overview.active) {
    return <AdminActiveOdaiEmptyState />
  }

  return <AdminActiveOdaiDetail odai={overview.odai} />
}

export function AdminActiveOdaiPanelSkeleton() {
  return (
    <section
      className={`${panelClassName} border-t-stone-400`}
      aria-label="現在のお題を読み込み中"
      aria-busy="true"
    >
      <div className="grid gap-2">
        <p className="text-sm font-bold text-stone-500">現在のお題</p>
        <div className="h-8 w-3/4 max-w-md animate-pulse rounded-md bg-stone-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="grid gap-1">
            <div className="h-4 w-16 animate-pulse rounded bg-stone-200" />
            <div className="h-7 w-32 animate-pulse rounded-md bg-stone-200" />
          </div>
        ))}
      </div>
    </section>
  )
}
