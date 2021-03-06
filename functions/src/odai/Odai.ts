import { ApiPostStatus, SlackParams } from '../api/Api'
import { ApiError } from '../api/Error'

type OdaiBase = {
  title: string
  dueDate: number
  createdBy: string
  imageUrl?: string
}

export type OdaiPostRequestParams = OdaiBase & SlackParams

export type OdaiStatus = 'posting' | 'voting' | 'finished'

type OdaiApiBase = OdaiBase & {
  status: OdaiStatus
}

export type OdaiPostData = Omit<OdaiApiBase, 'dueDate'> & {
  dueDate: Date
  createdAt: Date
}

export type OdaiPutApiStatus = ApiPostStatus

export type OdaiPutStatusParams = SlackParams

export type OdaiPutStatusData = Pick<OdaiApiBase, 'status'> & SlackParams

export type OdaiCurrentParams = SlackParams

export type OdaiCurrentResponse =
  | (OdaiApiBase & {
      docId: string
      createdAt: number
    })
  | ApiError

export type OdaiRecentFinishedParams = SlackParams

export type OdaiRecentFinishedResponse = OdaiCurrentResponse | ApiError
