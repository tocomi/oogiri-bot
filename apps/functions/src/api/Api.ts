import { ApiError } from './Error'

export type SlackParams = {
  slackTeamId: string
}

export type PeriodParams = {
  /** 集計期間の開始（Unix ミリ秒、この値を含む） */
  from: number
  /** 集計期間の終了（Unix ミリ秒、この値を含まない） */
  to: number
}

export type SlackPeriodParams = SlackParams & PeriodParams

export type ApiPostStatus = 'ok' | ApiError
