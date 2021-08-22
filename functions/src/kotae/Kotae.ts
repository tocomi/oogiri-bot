import { ApiStatus, SlackParams } from '../api/Api'
import { OdaiStatus } from '../odai/Odai'

export type KotaeApiStatus = ApiStatus | 'noOdai'

type KotaeBase = {
  content: string
  createdBy: string
}

export type KotaePostRequestParams = KotaeBase & SlackParams

export type KotaeOfCurrentOdaiParams = SlackParams

type KotaeApiBase = KotaeBase & {
  votedCount: number
}

export type KotaePostData = KotaeApiBase & {
  createdAt: Date
}

export type KotaeResponse = KotaeApiBase & {
  createdAt: number
}

export type KotaeGetAllResponse = {
  odaiTitle: string
  odaiDueDate: number
  odaiStatus: OdaiStatus
  kotaeList: KotaeResponse[]
}

export type KotaePersonalResultParams = SlackParams & {
  userId: string
}

export type KotaePersonalResultResponse = KotaeGetAllResponse
