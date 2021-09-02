import { SlackParams } from '../api/Api'
import { ApiError } from '../api/Error'

type VoteBase = {
  votedBy: string
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
  uniqueUserCount: number
  voteCount: number
}

export type VoteCountParams = SlackParams

export type VoteCountResponse = VoteCount | ApiError
