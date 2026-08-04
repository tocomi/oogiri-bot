import { SlackParams } from '../api/Api'
import { ApiError } from '../api/Error'
import { CommentatorCommentary, OdaiStatus } from '../odai/Odai'
import { Vote } from '../vote/Vote'

export type Kotae = {
  id: string
  content: string
  createdBy: string
  votedCount: number
  votedFirstCount: number
  votedSecondCount: number
  votedThirdCount: number
  createdAt: number
}

export type KotaePostRequestParams = Pick<Kotae, 'content' | 'createdBy'> &
  SlackParams & {
    id: string
  }

export type KotaeOfCurrentOdaiParams = SlackParams

export type KotaePostData = Omit<Kotae, 'createdAt' | 'id'> & {
  createdAt: Date
}

type KotaeGetBase = {
  odaiTitle: string
  odaiImageUrl?: string
  odaiDueDate: number
  odaiStatus: OdaiStatus
}
export type KotaeGetAllResponse =
  | (KotaeGetBase & { kotaeList: Kotae[] })
  | ApiError

export type KotaePersonalResultParams = SlackParams & {
  userId: string
}

export type KotaeVotedByParams = SlackParams & {
  odaiDocId: string
  kotaeDocId: string
}

export type KotaeVotedBy = Pick<Vote, 'votedBy' | 'rank' | 'createdAt'>

export type KotaeResultResponse = Kotae & {
  votedByList: KotaeVotedBy[]
}
export type KotaePersonalResultResponse =
  | (KotaeGetBase & { kotaeList: KotaeResultResponse[] })
  | ApiError

export type KotaeByContentParams = SlackParams & {
  content: string
  /** 解決済みのお題 ID。呼び出し側で解決してから渡す */
  odaiId: string
}

/** repository 層の検索条件 */
export type KotaeByContentQuery = SlackParams & {
  content: string
  odaiDocId: string
}

/** 回答の識別に必要な情報のみ。投票数の集計は含まない */
export type KotaeIdentity = Pick<
  Kotae,
  'id' | 'content' | 'createdBy' | 'createdAt'
>

export type KotaeByContentResponse = KotaeIdentity | ApiError

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

export type KotaePersonalCommentaryParams = SlackParams & {
  userId: string
}

export type KotaePersonalCommentaryResponse =
  | { odaiTitle: string; commentary: CommentatorCommentary }
  | ApiError
