import { ApiStatus, SlackParams } from '../api/Api'

export type VoteApiStatus = ApiStatus | 'noKotae' | 'noOdai' | 'alreadyVoted'

type VoteBase = {
  votedBy: string
}

export type VoteRequestParams = SlackParams &
  VoteBase & {
    content: string
  }

export type Vote = VoteBase & {
  createdAt: Date
}

export type VoteOfCurrentOdaiParams = SlackParams

export type VoteOfCurrentOdaiResponse = Vote[]
