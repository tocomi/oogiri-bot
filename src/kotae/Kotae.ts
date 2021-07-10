import { PostResponse, SlackParams } from '../api/Api'

export type KotaePostRequestParams = {
  content: string
  createdBy: string
} & SlackParams

export type KotaePostResponse = PostResponse
