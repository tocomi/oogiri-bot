import { ApiPostStatus, SlackParams } from '../api/Api'
import { ApiError } from '../api/Error'
import { Kotae } from '../kotae/Kotae'

type OdaiBase = {
  title: string
  createdBy: string
  imageUrl?: string
}

type Odai = OdaiBase &
  (
    | {
        type: 'normal'
        dueDate: number
      }
    | {
        type: 'ippon'
        ipponVoteCount: number
        winIpponCount: number
      }
  )

type StatBase = {
  kotaeContent: string
  userName: string
}

type PointStat = StatBase & {
  type: 'point'
  point: number
  votedFirstCount: number
  votedSecondCount: number
  votedThirdCount: number
}

type CountStat = StatBase & {
  type: 'count'
  votedCount: number
}

export type OdaiResult = {
  id: string
  kotaeCount: number
  voteCount: number
  pointStats: PointStat[]
  countStats: CountStat[]
}

export type OdaiWithResult = Omit<Extract<Odai, { type: 'normal' }>, 'type'> & OdaiResult

export type OdaiWithResultSummary = Omit<Extract<Odai, { type: 'normal' }>, 'type'> &
  Pick<OdaiResult, 'id' | 'kotaeCount' | 'voteCount'>

export type OdaiPostRequestParams = Odai & SlackParams
export type OdaiNormalPostRequest = Extract<OdaiPostRequestParams, { type: 'normal' }>
export type OdaiIpponPostRequest = Extract<OdaiPostRequestParams, { type: 'ippon' }>

export type OdaiStatus = 'posting' | 'voting' | 'finished'

type OdaiApiBase = Odai & {
  status: OdaiStatus
}

export type OdaiNormalPostData = Omit<Extract<OdaiApiBase, { type: 'normal' }>, 'dueDate'> & {
  dueDate: Date
  createdAt: Date
}
export type OdaiIpponPostData = Extract<OdaiApiBase, { type: 'ippon' }> & {
  createdAt: Date
}

export type OdaiPutApiStatus = ApiPostStatus

export type OdaiPutStatusParams = SlackParams

export type OdaiFinishParams = OdaiPutStatusParams & { kotaeList: Kotae[] }

export type OdaiPutStatusData = Pick<OdaiApiBase, 'status'> & SlackParams

export type OdaiCurrentParams = SlackParams

export type OdaiResponseBase = OdaiApiBase & {
  docId: string
  createdAt: number
}

export type OdaiCurrentResponse = OdaiResponseBase | ApiError

export type OdaiRecentFinishedParams = SlackParams

export type OdaiRecentFinishedResponse = OdaiResponseBase | ApiError

export type OdaiFinishedListParams = SlackParams

export type OdaiFinishedListResponse = OdaiResponseBase[] | ApiError

export type OdaiAddResultParams = SlackParams & { odaiResult: OdaiResult }

export type OdaiGetAllResultsParams = SlackParams

export type OdaiGetResultParams = SlackParams & { odaiId: string }
