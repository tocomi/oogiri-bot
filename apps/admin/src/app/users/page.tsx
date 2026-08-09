import { AdminUserScreen } from '@/features/users/components/AdminUserScreen'

export const dynamic = 'force-dynamic'

type UsersPageProps = {
  searchParams: Promise<{ period?: string; sort?: string }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { period, sort } = await searchParams

  return (
    <AdminUserScreen periodParam={period ?? null} sortParam={sort ?? null} />
  )
}
