import { SlackParams } from '../api/Api'

export type AdminAvailableYears = {
  /** お題が 1 件以上ある年（日本時間基準）。新しい順 */
  years: number[]
}

export type AdminAvailableYearsParams = SlackParams
