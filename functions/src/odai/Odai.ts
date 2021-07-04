import { ApiStatus, SlackParams } from '../api/Api'

export type OdaiApiStatus = 'duplication' | ApiStatus

type OdaiBase = {
  title: string
  createdBy: string
}

export type OdaiPostRequestParams = OdaiBase & SlackParams

type OdaiStatus = 'posting' | 'voting' | 'finished'

type OdaiApiBase = OdaiBase & {
  status: OdaiStatus
}

export type OdaiPostData = OdaiApiBase & {
  createdAt: Date
}

export type OdaiCurrentParams = SlackParams

export type OdaiCurrentResponse = OdaiApiBase & {
  createdAt: number
}
