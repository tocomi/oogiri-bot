import { ApiPostStatus, SlackParams } from '../api/Api'
import { ApiError } from '../api/Error'

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
