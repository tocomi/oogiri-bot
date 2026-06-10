export type AdminDashboardMetrics = {
  odaiCount: number
  kotaeCount: number
  voteCount: number
}

const MOCK_ADMIN_DASHBOARD_METRICS: AdminDashboardMetrics = {
  odaiCount: 12,
  kotaeCount: 48,
  voteCount: 156,
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  await new Promise((resolve) => setTimeout(resolve, 1500))

  return MOCK_ADMIN_DASHBOARD_METRICS
}
