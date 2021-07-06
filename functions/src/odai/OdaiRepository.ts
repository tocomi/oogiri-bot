import {
  OdaiApiStatus,
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiPostData,
  OdaiPostRequestParams,
  OdaiPutApiStatus,
  OdaiPutStatusData,
} from './Odai'
import { db, convertTimestamp, createDoc } from '../firebase/firestore'

export interface OdaiRepository {
  create(params: OdaiPostRequestParams): Promise<OdaiApiStatus>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null>
  updateStatus(params: OdaiPutStatusData, odaiDocId: string): Promise<OdaiPutApiStatus>
}

export class OdaiRepositoryImpl implements OdaiRepository {
  async create({ title, createdBy, slackTeamId }: OdaiPostRequestParams): Promise<OdaiApiStatus> {
    const data: OdaiPostData = {
      title,
      createdBy,
      status: 'posting',
      createdAt: new Date(),
    }
    const docRef = db.collection(slackTeamId).doc()
    const result = await createDoc<OdaiPostData>(docRef, data)
    return result ? 'ok' : 'error'
  }

  async getCurrent({ slackTeamId }: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    const snapshot = await db.collection(slackTeamId).where('status', '!=', 'finished').get()
    if (snapshot.empty) {
      console.log('No active odai.')
      return null
    }
    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      docId: doc.id,
      title: data.title,
      createdBy: data.createdBy,
      status: data.status,
      createdAt: convertTimestamp(data.createdAt),
    }
  }

  async updateStatus(
    { slackTeamId, status }: OdaiPutStatusData,
    odaiDocId: string
  ): Promise<OdaiPutApiStatus> {
    const docRef = db.collection(slackTeamId).doc(odaiDocId)
    const result = await docRef
      .set(
        {
          status,
        },
        { merge: true }
      )
      .then(() => true)
      .catch((error) => {
        console.error(error)
        return false
      })
    return result ? 'ok' : 'error'
  }
}
