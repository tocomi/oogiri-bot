import type { AdminUserStatsItem } from '@/features/users/api/adminUsers'

/**
 * 一覧や図に出す名前を決める
 * 退職などで表示名を引けないユーザーも追跡できるよう、その場合は ID をそのまま見せる
 */
export const formatAdminUserName = (
  item: Pick<AdminUserStatsItem, 'name' | 'userId'>,
) => item.name ?? item.userId

/**
 * 回答 1 件あたり何票を投じているかを表す
 * 回答していない人は比を出せないため、計算せずに記号で示す
 */
export const formatAdminVoteRatio = ({
  kotaeCount,
  voteCount,
}: Pick<AdminUserStatsItem, 'kotaeCount' | 'voteCount'>) => {
  if (kotaeCount === 0) return '—'
  return (voteCount / kotaeCount).toFixed(2)
}
