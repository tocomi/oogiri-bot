import { OdaiRepository } from '../repository/OdaiRepository'
import {
  OdaiApiStatus,
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiPostRequestParams,
} from '../types/Odai'

export interface OdaiUseCase {
  create(params: OdaiPostRequestParams): Promise<OdaiApiStatus>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null>
}

export class OdaiUseCaseImpl implements OdaiUseCase {
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
