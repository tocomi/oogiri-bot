import { SlackParams } from '../api/Api'
import { ApiError } from '../api/Error'
import { OdaiStatus } from '../odai/Odai'

type KotaeBase = {
  content: string
  createdBy: string
}

export type KotaePostRequestParams = KotaeBase & SlackParams

export type KotaeOfCurrentOdaiParams = SlackParams

type KotaeApiBase = KotaeBase & {
  votedCount: number
  votedFirstCount: number
  votedSecondCount: number
  votedThirdCount: number
}

export type KotaePostData = KotaeApiBase & {
  createdAt: Date
}

export type KotaeResponse = KotaeApiBase & {
  createdAt: number
}

export type KotaeGetAllResponse =
  | {
      odaiTitle: string
      odaiImageUrl?: string
      odaiDueDate: number
      odaiStatus: OdaiStatus
      kotaeList: KotaeResponse[]
    }
  | ApiError

export type KotaePersonalResultParams = SlackParams & {
  userId: string
}

export type KotaePersonalResultResponse = KotaeGetAllResponse

export type KotaeByContentParams = SlackParams & {
  content: string
}

export type KotaeByContentResponse =
  | (KotaeResponse & {
      docId: string
    })
  | ApiError

export type KotaeIncrementVoteCountParams = SlackParams & {
  content: string
  rank: 1 | 2 | 3
}
