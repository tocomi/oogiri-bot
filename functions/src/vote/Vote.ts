import { ApiStatus, SlackParams } from '../api/Api'

export type VoteApiStatus = ApiStatus | 'noKotae' | 'noOdai' | 'alreadyVoted'

type VoteBase = {
  votedBy: string
}

export type VoteRequestParams = SlackParams &
  VoteBase & {
    content: string
  }

export type VotePostData = VoteBase & {
  createdAt: Date
}
