import { OdaiRepository } from '../repository/OdaiRepository'

export interface OdaiUseCase {
  create(data: { title: string; createdBy: string }): Promise<any>
}

export class OdaiUseCaseImpl implements OdaiUseCase {
  repository: OdaiRepository

  constructor(repository: OdaiRepository) {
    this.repository = repository
  }

  create(data: { title: string; createdBy: string }): Promise<any> {
    return this.repository.create(data)
  }
}
