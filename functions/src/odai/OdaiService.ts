import { OdaiRepository } from './OdaiRepository'
import {
  OdaiApiStatus,
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiPostRequestParams,
} from './Odai'

export interface OdaiService {
  create(params: OdaiPostRequestParams): Promise<OdaiApiStatus>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null>
}

export class OdaiServiceImpl implements OdaiService {
  repository: OdaiRepository

  constructor(repository: OdaiRepository) {
    this.repository = repository
  }

  create(params: OdaiPostRequestParams): Promise<OdaiApiStatus> {
    return this.repository.create(params)
  }

  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    return this.repository.getCurrent(params)
  }
}
