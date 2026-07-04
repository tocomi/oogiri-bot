import { getAdminActiveOdaiOverview } from '@/features/dashboard/api/adminActiveOdai'

import {
  AdminActiveOdaiPanel,
  AdminActiveOdaiPanelSkeleton,
} from './AdminActiveOdaiPanel'

export async function AdminActiveOdaiOverview() {
  const overview = await getAdminActiveOdaiOverview()

  return <AdminActiveOdaiPanel overview={overview} />
}

export { AdminActiveOdaiPanelSkeleton as AdminActiveOdaiOverviewSkeleton }
