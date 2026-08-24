import { AdminUserScreen } from '@/features/users/components/AdminUserScreen'

export const dynamic = 'force-dynamic'

type UsersPageProps = {
  searchParams: Promise<{
    period?: string
    sort?: string
    anonymous?: string
  }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { anonymous, period, sort } = await searchParams

  return (
    <AdminUserScreen
      anonymousParam={anonymous ?? null}
      periodParam={period ?? null}
      sortParam={sort ?? null}
    />
  )
}
