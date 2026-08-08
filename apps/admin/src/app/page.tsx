import { AdminReportingScreen } from '@/features/reporting/components/AdminReportingScreen'

export const dynamic = 'force-dynamic'

type HomeProps = {
  searchParams: Promise<{ period?: string; odaiId?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const { period, odaiId } = await searchParams

  return (
    <AdminReportingScreen
      periodParam={period ?? null}
      odaiId={odaiId ?? null}
    />
  )
}
