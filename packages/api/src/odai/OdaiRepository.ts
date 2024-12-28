import {
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiFinishedListParams,
  OdaiNormalPostRequest,
  OdaiPutStatusData,
  OdaiRecentFinishedParams,
  OdaiRecentFinishedResponse,
  OdaiResponseBase,
  OdaiIpponPostRequest,
  OdaiAddResultParams,
  OdaiGetAllResultsParams,
  OdaiGetResultParams,
  OdaiWithResult,
} from './Odai'

export interface OdaiRepository {
  createNormal(params: OdaiNormalPostRequest): Promise<boolean>
  createIppon(params: OdaiIpponPostRequest): Promise<boolean>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null>
  getRecentFinished(params: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse | null>
  getAllFinished(params: OdaiFinishedListParams): Promise<OdaiResponseBase[]>
  updateStatus(params: OdaiPutStatusData, odaiId: string): Promise<boolean>
  createResult(params: OdaiAddResultParams): Promise<boolean>
  getAllResults(params: OdaiGetAllResultsParams): Promise<OdaiWithResult[]>
  getResult(params: OdaiGetResultParams): Promise<OdaiWithResult | null>
}
