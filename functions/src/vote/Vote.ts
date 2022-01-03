import { SlackParams } from '../api/Api'
import { ApiError } from '../api/Error'
import { OdaiStatus } from '../odai/Odai'

type VoteBase = {
  votedBy: string
  rank: 1 | 2 | 3
}

export type VoteRequestParams = SlackParams &
  VoteBase & {
    content: string
  }

export type Vote = VoteBase & {
  createdAt: Date | number
  kotaeId: string
  kotaeContent: string
}

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
