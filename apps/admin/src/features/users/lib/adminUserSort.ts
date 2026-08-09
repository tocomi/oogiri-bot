import type { AdminUserStatsItem } from '@/features/users/api/adminUsers'

/** 一覧を並べ替えられる指標 */
export const ADMIN_USER_SORTS = ['kotae', 'vote', 'odai'] as const

export type AdminUserSort = (typeof ADMIN_USER_SORTS)[number]

/** 既定の並び。まずは書いている量から見せる */
export const ADMIN_DEFAULT_USER_SORT: AdminUserSort = 'kotae'

/**
 * searchParams の値を並び替えの指定に変換する
 * 不正な値でも一覧は出せるよう、既定の並びに倒す
 */
export const parseAdminUserSort = (value: string | null): AdminUserSort => {
  const found = ADMIN_USER_SORTS.find((sort) => sort === value)
  return found ?? ADMIN_DEFAULT_USER_SORT
}

/** 指標ごとの件数の引き方。指標を増やしたときの追従先をここ 1 箇所にまとめる */
const ADMIN_USER_METRIC_COUNTS: {
  [metric in AdminUserSort]: (item: AdminUserStatsItem) => number
} = {
  kotae: (item) => item.kotaeCount,
  vote: (item) => item.voteCount,
  odai: (item) => item.postedOdaiCount,
}

/**
 * 指定された指標の多い順にユーザーを並べる
 * 一覧の並びはここだけで決まるため、API が返す順序には依存しない
 * 同数の並びが表示ごとに揺れないよう、選択中の指標に続けて残りを
 * `kotae` → `vote` → `odai` の固定順で比較し、最後にユーザー ID 昇順で確定させる
 */
export const sortAdminUsers = (
  items: AdminUserStatsItem[],
  sort: AdminUserSort,
): AdminUserStatsItem[] => {
  const metricsByPriority = [
    sort,
    ...ADMIN_USER_SORTS.filter((metric) => metric !== sort),
  ]

  return [...items].sort((a, b) => {
    for (const metric of metricsByPriority) {
      const count = ADMIN_USER_METRIC_COUNTS[metric]
      const difference = count(b) - count(a)
      if (difference !== 0) return difference
    }

    return a.userId.localeCompare(b.userId)
  })
}
