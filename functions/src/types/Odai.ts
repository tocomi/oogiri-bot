import { ApiStatus, SlackParams } from './Api'

export type OdaiApiStatus = 'duplication' | ApiStatus

export type OdaiPostRequestParams = {
  title: string
  createdBy: string
} & SlackParams

type OdaiStatus = 'posting' | 'voting' | 'finished'

export type OdaiPostData = {
  title: string
  createdBy: string
  status: OdaiStatus
  createdAt: Date
}
