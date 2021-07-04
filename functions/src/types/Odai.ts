import { ApiStatus, SlackParams } from './Api'

export type OdaiApiStatus = 'duplication' | ApiStatus

export type OdaiPostRequestParams = {
  title: string
  createdBy: string
} & SlackParams

type OdaiStatus = 'posting' | 'voting' | 'finished'

type OdaiBase = {
  title: string
  createdBy: string
  status: OdaiStatus
}

export type OdaiPostData = OdaiBase & {
  createdAt: Date
}

export type OdaiCurrentParams = SlackParams

export type OdaiCurrentResponse = OdaiBase & {
  createdAt: number
}
