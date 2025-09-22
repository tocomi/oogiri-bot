import { PostResponse, SlackParams } from '../api/Api'
import { KotaeListResponse } from '../kotae/Kotae'

export type OdaiGetCurrentRequestParams = SlackParams

export type OdaiGetCurrentResponse = {
  odai: {
    type: 'normal' | 'ippon'
    status: OdaiStatus
  }
}

type OdaiRequestBase = {
  title: string
  createdBy: string
  imageUrl?: string
} & SlackParams

export type OdaiPostRequestParams = OdaiRequestBase &
  (
    | {
        type: 'normal'
        dueDate: number
      }
    | {
        type: 'ippon'
        ipponVoteCount: number
        winIpponCount: number
      }
  )

export type OdaiStatus = 'posting' | 'voting' | 'finished'

export type OdaiPostResponse = PostResponse

export type OdaiStartVotingRequestParams = SlackParams

export type OdaiStartVotingResponse = KotaeListResponse

export type OdaiFinishRequestParams = SlackParams

export type CommentatorCommentary = {
  matsumoto: string
  bakarism: string
  kawashima: string
}

export type OdaiFinishResponse = KotaeListResponse & {
  aiCommentary: CommentatorCommentary
}
