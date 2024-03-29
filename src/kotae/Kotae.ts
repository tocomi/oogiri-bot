import { PostResponse, SlackParams } from '../api/Api'
import { OdaiStatus } from '../odai/Odai'

type VotedBy = {
  votedBy: string
  rank: 1 | 2 | 3
  createdAt: string
}
export type Kotae = {
  content: string
  createdBy: string
  votedCount: number
  votedFirstCount: number
  votedSecondCount: number
  votedThirdCount: number
  createdAt: number
  votedByList: VotedBy[]
}

export type PointedKotae = Kotae & {
  point: number
}

export type RankedKotae = PointedKotae & {
  rank: 1 | 2 | 3
}

export type KotaePostRequestParams = {
  content: string
  createdBy: string
} & SlackParams

export type KotaePostResponse = PostResponse

export type KotaeListRequestParams = SlackParams

export type KotaeListResponse = {
  odaiTitle: string
  odaiImageUrl?: string
  odaiDueDate: number
  odaiStatus: OdaiStatus
  kotaeList: Kotae[]
}

export type KotaeCount = {
  odaiTitle: string
  odaiImageUrl?: string
  odaiDueDate: number
  odaiStatus: OdaiStatus
  uniqueUserCount: number
  kotaeCount: number
}

export type KotaePersonalResultParams = SlackParams & {
  userId: string
}

export type KotaePersonalResultResponse = KotaeListResponse
