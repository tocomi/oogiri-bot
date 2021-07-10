import { PostResponse, SlackParams } from '../api/Api'

export type OdaiPostRequestParams = {
  title: string
  createdBy: string
} & SlackParams

export type OdaiPostResponse = PostResponse
