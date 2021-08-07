import { ApiStatus, SlackParams } from '../api/Api'

export type VoteApiStatus = ApiStatus | 'noKotae' | 'noOdai' | 'alreadyVoted' | 'noVotingOdai'

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

export type VoteOfCurrentOdaiResponse = Vote[]

export type VoteCount = {
  odaiTitle: string
  uniqueUserCount: number
  voteCount: number
}
