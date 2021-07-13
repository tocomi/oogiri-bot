import { PostResponse, SlackParams } from '../api/Api'

export type Kotae = {
  content: string
  createdBy: string
  votedCount: number
  createdAt: number
}

export type RankedKotae = Kotae & {
  rank: 1 | 2 | 3
}

export type KotaePostRequestParams = {
  content: string
  createdBy: string
} & SlackParams

export type KotaePostResponse = PostResponse
