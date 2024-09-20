import { ApiError } from './Error'

export type SlackParams = {
  slackTeamId: string
}

export type ApiPostStatus = 'ok' | ApiError
