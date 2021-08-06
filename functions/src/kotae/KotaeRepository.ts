import { convertTimestamp, createDoc, db } from '../firebase/firestore'
import {
  KotaeApiStatus,
  KotaeOfCurrentOdaiParams,
  KotaePersonalResultParams,
  KotaePostData,
  KotaePostRequestParams,
  KotaeResponse,
} from './Kotae'

const KOTAE_COLLECTION_NAME = 'kotae'

export interface KotaeRepository {
  create(params: KotaePostRequestParams, odaiDocId: string): Promise<KotaeApiStatus>
  getAllOfCurrentOdai(params: KotaeOfCurrentOdaiParams, odaiDocId: string): Promise<KotaeResponse[]>
  getPersonalResult(params: KotaePersonalResultParams, odaiDocId: string): Promise<KotaeResponse[]>
}

export class KotaeRepositoryImpl implements KotaeRepository {
  async create(
    { content, createdBy, slackTeamId }: KotaePostRequestParams,
    odaiDocId: string
  ): Promise<KotaeApiStatus> {
    const data: KotaePostData = {
      content,
      createdBy,
      votedCount: 0,
      createdAt: new Date(),
    }
    const docRef = db.collection(slackTeamId).doc(odaiDocId).collection(KOTAE_COLLECTION_NAME).doc()
    const result = await createDoc<KotaePostData>(docRef, data)
    return result ? 'ok' : 'error'
  }

  async getAllOfCurrentOdai(
    { slackTeamId }: KotaeOfCurrentOdaiParams,
    odaiDocId: string
  ): Promise<KotaeResponse[]> {
    const snapshot = await db
      .collection(slackTeamId)
      .doc(odaiDocId)
      .collection(KOTAE_COLLECTION_NAME)
      .get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        content: data.content,
        createdBy: data.createdBy,
        votedCount: data.votedCount,
        createdAt: convertTimestamp(data.createdAt),
      }
    })
  }

  async getPersonalResult(
    { slackTeamId, userId }: KotaePersonalResultParams,
    odaiDocId: string
  ): Promise<KotaeResponse[]> {
    const snapshot = await db
      .collection(slackTeamId)
      .doc(odaiDocId)
      .collection(KOTAE_COLLECTION_NAME)
      .where('createdBy', '==', userId)
      .orderBy('votedCount', 'desc')
      .get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        content: data.content,
        createdBy: data.createdBy,
        votedCount: data.votedCount,
        createdAt: convertTimestamp(data.createdAt),
      }
    })
  }
}
