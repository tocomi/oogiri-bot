import { SlackParams } from '../api/Api'
import { Ippon, WinResult } from '../ippon/Ippon'
import { OdaiStatus } from '../odai/Odai'

export type VotePostRequestParams = {
  content: string
  rank: 1 | 2 | 3
  votedBy: string
} & SlackParams

export type VotePostResponse = {
  vote: Pick<VotePostRequestParams, 'content' | 'rank' | 'votedBy'>
  ippon?: Ippon
  winResult?: WinResult
}

export type VoteCountRequestParams = SlackParams

export type VoteCount = {
  odaiTitle: string
  odaiImageUrl?: string
  odaiStatus: OdaiStatus
  uniqueUserCount: number
  voteCount: number
}

export type VoteResultRequestParams = { userId: string } & SlackParams

type VoteResult = {
  votedBy: string
  voteCount: number
}
export type VoteResultResponse = {
  allCount: VoteResult[]
  recent5timesCount: VoteResult[]
}
