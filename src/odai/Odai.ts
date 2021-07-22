import { PostResponse, SlackParams } from '../api/Api'
import { KotaeListResponse } from '../kotae/Kotae'

export type OdaiPostRequestParams = {
  title: string
  createdBy: string
} & SlackParams

export type OdaiPostResponse = PostResponse

export type OdaiStartVotingRequestParams = SlackParams

export type OdaiStartVotingResponse = KotaeListResponse

export type OdaiFinishRequestParams = SlackParams

export type OdaiFinishResponse = KotaeListResponse
