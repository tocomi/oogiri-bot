import type { AdminUserStatsItem } from '@/features/users/api/adminUsers'

/** 一覧を並べ替えられる指標 */
export const ADMIN_USER_SORTS = ['kotae', 'vote'] as const

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

/**
 * 指定された指標の多い順にユーザーを並べる
 * 同数の並びが表示ごとに揺れないよう、もう一方の指標とユーザー ID で確定させる
 */
export const sortAdminUsers = (
  items: AdminUserStatsItem[],
  sort: AdminUserSort,
): AdminUserStatsItem[] => {
  const primary = (item: AdminUserStatsItem) =>
    sort === 'kotae' ? item.kotaeCount : item.voteCount
  const secondary = (item: AdminUserStatsItem) =>
    sort === 'kotae' ? item.voteCount : item.kotaeCount

  return [...items].sort(
    (a, b) =>
      primary(b) - primary(a) ||
      secondary(b) - secondary(a) ||
      a.userId.localeCompare(b.userId),
  )
}
