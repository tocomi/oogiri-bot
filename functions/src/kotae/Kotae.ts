import { ApiStatus, SlackParams } from '../api/Api'

export type KotaeApiStatus = ApiStatus | 'noOdai'

type KotaeBase = {
  content: string
  createdBy: string
}

export type KotaePostRequestParams = KotaeBase & SlackParams

export type KotaeOfCurrentOdaiParamas = SlackParams

type KotaeApiBase = KotaeBase & {
  votedCount: number
}

export type KotaePostData = KotaeApiBase & {
  createdAt: Date
}

export type KotaeResponse = KotaeApiBase & {
  createdAt: number
}
