import {
  OdaiApiStatus,
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiPostData,
  OdaiPostRequestParams,
} from './Odai'
import { db, createNewDoc, convertTimestamp } from '../firebase/firestore'

export interface OdaiRepository {
  create(params: OdaiPostRequestParams): Promise<OdaiApiStatus>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null>
}

export class OdaiRepositoryImpl implements OdaiRepository {
  async create({ title, createdBy, slackTeamId }: OdaiPostRequestParams): Promise<OdaiApiStatus> {
    const data: OdaiPostData = {
      title,
      createdBy,
      status: 'posting',
      createdAt: new Date(),
    }
    const result = await createNewDoc({
      collectionName: slackTeamId,
      data,
    })
    return result ? 'ok' : 'error'
  }

  async getCurrent({ slackTeamId }: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    const snapshot = await db.collection(slackTeamId).where('status', '!=', 'finished').get()
    if (snapshot.empty) {
      console.log('No active odai.')
      return null
    }
    const data = snapshot.docs[0].data()
    return {
      title: data.title,
      createdBy: data.createdBy,
      status: data.status,
      createdAt: convertTimestamp(data.createdAt),
    }
  }
}
