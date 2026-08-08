import { Badge } from '@/components/ui/badge'

type OdaiStatus = 'posting' | 'voting' | 'finished'

const STATUS_LABEL: Record<OdaiStatus, string> = {
  posting: '募集中',
  voting: '投票中',
  finished: '発表済',
}

type AdminOdaiStatusBadgeProps = {
  status: OdaiStatus
}

/**
 * お題の進行状態を表す
 * 進行中のものだけ目に留まればよいため、発表済みは控えめにする
 */
export function AdminOdaiStatusBadge({ status }: AdminOdaiStatusBadgeProps) {
  return (
    <Badge
      variant={status === 'finished' ? 'outline' : 'secondary'}
      className="text-[11px] font-semibold"
    >
      {STATUS_LABEL[status]}
    </Badge>
  )
}
