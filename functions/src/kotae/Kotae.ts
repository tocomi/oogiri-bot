import { SlackParams } from '../api/Api'
import { ApiError } from '../api/Error'
import { OdaiStatus } from '../odai/Odai'
import { Vote } from '../vote/Vote'

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
  docId: string
  createdAt: number
}

type KotaeGetBase = {
  odaiTitle: string
  odaiImageUrl?: string
  odaiDueDate: number
  odaiStatus: OdaiStatus
}
export type KotaeGetAllResponse = (KotaeGetBase & { kotaeList: KotaeResponse[] }) | ApiError

export type KotaePersonalResultParams = SlackParams & {
  userId: string
}

export type KotaeVotedByParams = SlackParams & {
  odaiDocId: string
  kotaeDocId: string
}

export type KotaeVotedBy = Pick<Vote, 'votedBy' | 'rank' | 'createdAt'>

export type KotaeResultResponse = KotaeResponse & {
  votedByList: KotaeVotedBy[]
}
export type KotaePersonalResultResponse =
  | (KotaeGetBase & { kotaeList: KotaeResultResponse[] })
  | ApiError

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

export type KotaeCountsRequest = SlackParams
export type KotaeCountsResponse =
  | {
      kotaeCount: number
      kotaeUserCount: number
    }
  | ApiError
