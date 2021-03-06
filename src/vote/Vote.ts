import { PostResponse, SlackParams } from '../api/Api'
import { OdaiStatus } from '../odai/Odai'

export type VotePostRequestParams = {
  content: string
  rank: 1 | 2 | 3
  votedBy: string
} & SlackParams

export type VotePostResponse = PostResponse

export type VoteCountRequestParams = SlackParams

export type VoteCount = {
  odaiTitle: string
  odaiImageUrl?: string
  odaiStatus: OdaiStatus
  uniqueUserCount: number
  voteCount: number
}
