import { AdminReportingScreen } from '@/features/reporting/components/AdminReportingScreen'
import { parseAdminPeriodPreset } from '@/features/reporting/lib/adminPeriod'

export const dynamic = 'force-dynamic'

type HomeProps = {
  searchParams: Promise<{ period?: string; odaiId?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const { period, odaiId } = await searchParams

  return (
    <AdminReportingScreen
      period={parseAdminPeriodPreset(period)}
      odaiId={odaiId ?? null}
    />
  )
}
