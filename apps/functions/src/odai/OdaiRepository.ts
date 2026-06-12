import { SlackParams } from '../api/Api'
import {
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiFinishedListParams,
  OdaiNormalPostRequest,
  OdaiPutStatusData,
  OdaiRecentFinishedParams,
  OdaiRecentFinishedResponse,
  OdaiResponseBase,
  OdaiAddResultParams,
  OdaiGetAllResultsParams,
  OdaiGetResultParams,
  OdaiWithResult,
} from './Odai'

export interface OdaiRepository {
  createNormal(params: OdaiNormalPostRequest): Promise<boolean>
  /**
   * 登録されているお題の総数を取得する
   */
  countAll(params: SlackParams): Promise<number | null>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null>
  getRecentFinished(
    params: OdaiRecentFinishedParams,
  ): Promise<OdaiRecentFinishedResponse | null>
  getAllFinished(params: OdaiFinishedListParams): Promise<OdaiResponseBase[]>
  updateStatus(params: OdaiPutStatusData, odaiId: string): Promise<boolean>
  createResult(params: OdaiAddResultParams): Promise<boolean>
  getAllResults(params: OdaiGetAllResultsParams): Promise<OdaiWithResult[]>
  getResult(params: OdaiGetResultParams): Promise<OdaiWithResult | null>
}
