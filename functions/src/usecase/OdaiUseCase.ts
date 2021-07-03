import { OdaiRepository } from '../repository/OdaiRepository'
import { OdaiApiStatus, OdaiPostRequestParams } from '../types/Odai'

export interface OdaiUseCase {
  create(data: OdaiPostRequestParams): Promise<OdaiApiStatus>
}

export class OdaiUseCaseImpl implements OdaiUseCase {
  repository: OdaiRepository

  constructor(repository: OdaiRepository) {
    this.repository = repository
  }

  create(params: OdaiPostRequestParams): Promise<OdaiApiStatus> {
    return this.repository.create(params)
  }
}
