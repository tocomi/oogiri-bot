import { PostResponse, SlackParams } from '../api/Api'

export type VotePostRequestParams = {
  content: string
  votedBy: string
} & SlackParams

export type VotePostResponse = PostResponse
