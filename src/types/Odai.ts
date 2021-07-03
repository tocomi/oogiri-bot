import { SlackParams } from './Api'

export type OdaiPostRequestParams = {
  title: string
  createdBy: string
} & SlackParams

export type OdaiPostResponse = {
  error: boolean
  message?: string
}
