import { PostResponse, SlackParams } from '../api/Api'
import { KotaeListResponse } from '../kotae/Kotae'

export type OdaiPostRequestParams = {
  title: string
  dueDate: number
  createdBy: string
} & SlackParams

export type OdaiStatus = 'posting' | 'voting' | 'finished'

export type OdaiPostResponse = PostResponse

export type OdaiStartVotingRequestParams = SlackParams

export type OdaiStartVotingResponse = KotaeListResponse

export type OdaiFinishRequestParams = SlackParams

export type OdaiFinishResponse = KotaeListResponse
