import { PostResponse, SlackParams } from '../api/Api'
import { Kotae } from '../kotae/Kotae'

export type OdaiPostRequestParams = {
  title: string
  createdBy: string
} & SlackParams

export type OdaiPostResponse = PostResponse

export type OdaiStartVotingRequestParams = SlackParams

export type OdaiStartVotingResponse = {
  odaiTitle: string
  kotaeList: Kotae[]
}

export type OdaiFinishRequestParams = SlackParams

export type OdaiFinishResponse = {
  odaiTitle: string
  kotaeList: Kotae[]
}
