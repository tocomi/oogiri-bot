import { SlackParams } from '../api/Api'
import { ApiError } from '../api/Error'
import { Ippon, Win } from '../ippon/Ippon'
import { OdaiStatus } from '../odai/Odai'

type VoteBase = {
  votedBy: string
  rank: 1 | 2 | 3
}

export type Vote = VoteBase & {
  createdAt: Date | number
  kotaeId: string
  kotaeContent: string
  kotaeCreatedBy: string
}

export type VoteCreateRequest = SlackParams &
  VoteBase & {
    content: string
  }
export type VoteCreateResponse =
  | {
      vote: Vote
      ippon?: Ippon
      win?: Win
    }
  | ApiError

export type VoteOfCurrentOdaiParams = SlackParams

export type VoteCount = {
  odaiTitle: string
  odaiImageUrl?: string
  odaiStatus: OdaiStatus
  uniqueUserCount: number
  voteCount: number
}

export type VoteCountParams = SlackParams

export type VoteCountResponse = VoteCount | ApiError

export type VoteCountByUserParams = SlackParams & {
  userId: string
}

export type VoteCountByUser = {
  votedBy: string
  voteCount: number
}

export type VoteCountByUserResponse =
  | {
      allCount: VoteCountByUser[]
      recent5timesCount: VoteCountByUser[]
    }
  | ApiError
