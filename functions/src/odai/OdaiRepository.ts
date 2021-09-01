import {
  OdaiApiStatus,
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiPostData,
  OdaiPostRequestParams,
  OdaiPutApiStatus,
  OdaiPutStatusData,
  OdaiRecentFinishedParams,
  OdaiRecentFinishedResponse,
} from './Odai'
import { db, convertTimestamp, createDoc } from '../firebase/firestore'
import { COLLECTION_NAME } from '../const'

export interface OdaiRepository {
  create(params: OdaiPostRequestParams): Promise<OdaiApiStatus>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null>
  getRecentFinished(params: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse | null>
  updateStatus(params: OdaiPutStatusData, odaiDocId: string): Promise<OdaiPutApiStatus>
}

const odaiCollection = (slackTeamId: string) => {
  return db.collection(COLLECTION_NAME.ROOT).doc(slackTeamId).collection(COLLECTION_NAME.ODAI)
}

export class OdaiRepositoryImpl implements OdaiRepository {
  async create({
    title,
    dueDate,
    createdBy,
    slackTeamId,
  }: OdaiPostRequestParams): Promise<OdaiApiStatus> {
    const data: OdaiPostData = {
      title,
      dueDate: new Date(dueDate),
      createdBy,
      status: 'posting',
      createdAt: new Date(),
    }
    const docRef = odaiCollection(slackTeamId).doc()
    const result = await createDoc<OdaiPostData>(docRef, data)
    return result ? 'ok' : 'error'
  }

  async getCurrent({ slackTeamId }: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    const snapshot = await odaiCollection(slackTeamId).where('status', '!=', 'finished').get()
    if (snapshot.empty) {
      console.log('No active odai.')
      return null
    }
    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      docId: doc.id,
      title: data.title,
      dueDate: convertTimestamp(data.dueDate),
      createdBy: data.createdBy,
      status: data.status,
      createdAt: convertTimestamp(data.createdAt),
    }
  }

  async getRecentFinished({
    slackTeamId,
  }: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse | null> {
    const snapshot = await odaiCollection(slackTeamId)
      .where('status', '==', 'finished')
      .orderBy('createdAt', 'desc')
      .get()
    if (snapshot.empty) {
      console.log('No finished odai.')
      return null
    }
    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      docId: doc.id,
      title: data.title,
      dueDate: convertTimestamp(data.dueDate),
      createdBy: data.createdBy,
      status: data.status,
      createdAt: convertTimestamp(data.createdAt),
    }
  }

  async updateStatus(
    { slackTeamId, status }: OdaiPutStatusData,
    odaiDocId: string
  ): Promise<OdaiPutApiStatus> {
    const docRef = odaiCollection(slackTeamId).doc(odaiDocId)
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
