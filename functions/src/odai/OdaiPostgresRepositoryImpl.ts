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
  OdaiGetResultParams,
  OdaiWithResult,
  OdaiGetAllResultsParams,
} from './Odai'
import { OdaiRepository } from './OdaiRepository'

export class OdaiPostgresRepositoryImpl implements OdaiRepository {
  createNormal(params: OdaiNormalPostRequest): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  createIppon(params: OdaiIpponPostRequest): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    throw new Error('Method not implemented.')
  }
  getRecentFinished(params: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse | null> {
    throw new Error('Method not implemented.')
  }
  getAllFinished(params: OdaiFinishedListParams): Promise<OdaiResponseBase[]> {
    throw new Error('Method not implemented.')
  }
  updateStatus(params: OdaiPutStatusData, odaiDocId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  addResultField(params: OdaiAddResultParams): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  getAllResults(params: OdaiGetAllResultsParams): Promise<OdaiWithResult[]> {
    throw new Error('Method not implemented.')
  }
  getResult(params: OdaiGetResultParams): Promise<OdaiWithResult | null> {
    throw new Error('Method not implemented.')
  }
}
