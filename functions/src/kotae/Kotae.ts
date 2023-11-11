import { SlackParams } from '../api/Api'
import { ApiError } from '../api/Error'
import { OdaiStatus } from '../odai/Odai'
import { Vote } from '../vote/Vote'

export type Kotae = {
  content: string
  createdBy: string
  votedCount: number
  votedFirstCount: number
  votedSecondCount: number
  votedThirdCount: number
  createdAt: number
}

export type KotaePostRequestParams = Pick<Kotae, 'content' | 'createdBy'> & SlackParams

export type KotaeOfCurrentOdaiParams = SlackParams

export type KotaePostData = Kotae

export type KotaeResponse = Kotae & {
  docId: string
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

export type PointedKotae = Kotae & {
  point: number
}

export type RankedKotae = PointedKotae & {
  rank: 1 | 2 | 3
}
