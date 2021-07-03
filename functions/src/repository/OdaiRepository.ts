import { OdaiApiStatus, OdaiPostData, OdaiPostRequestParams } from '../types/Odai'
import * as firestore from '../firebase/firestore'

export interface OdaiRepository {
  create(data: OdaiPostRequestParams): Promise<OdaiApiStatus>
}

export class OdaiRepositoryImpl implements OdaiRepository {
  async create(params: OdaiPostRequestParams): Promise<OdaiApiStatus> {
    const data: OdaiPostData = {
      title: params.title,
      createdBy: params.createdBy,
      status: 'posting',
      createdAt: new Date(),
    }
    const result = await firestore.add({
      collectionName: params.slackTeamId,
      data,
    })
    return result ? 'ok' : 'error'
  }
}
