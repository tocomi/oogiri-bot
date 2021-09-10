import { PostResponse, SlackParams } from '../api/Api'

export type VotePostRequestParams = {
  content: string
  rank: 1 | 2 | 3
  votedBy: string
} & SlackParams

export type VotePostResponse = PostResponse

export type VoteCountRequestParams = SlackParams

export type VoteCount = {
  odaiTitle: string
  uniqueUserCount: number
  voteCount: number
}
