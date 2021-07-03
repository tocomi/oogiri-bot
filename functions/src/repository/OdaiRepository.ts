export interface OdaiRepository {
  create(data: { title: string; createdBy: string }): Promise<any>
}

export class OdaiRepositoryImpl implements OdaiRepository {
  create(data: { title: string; createdBy: string }): Promise<any> {
    console.log('👾 -> data', data)
    return Promise.resolve(data)
  }
}
