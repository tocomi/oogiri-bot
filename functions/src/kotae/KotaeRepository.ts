import { convertTimestamp, createDoc, db } from '../firebase/firestore'
import {
  KotaeApiStatus,
  KotaeOfCurrentOdaiParamas,
  KotaePostData,
  KotaePostRequestParams,
  KotaeResponse,
} from './Kotae'

const KOTAE_COLLECTION_NAME = 'kotae'

export interface KotaeRepository {
  create(params: KotaePostRequestParams, odaiDocId: string): Promise<KotaeApiStatus>
  getAllOfCurrentOdai(
    params: KotaeOfCurrentOdaiParamas,
    odaiDocId: string
  ): Promise<KotaeResponse[]>
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
    { slackTeamId }: KotaeOfCurrentOdaiParamas,
    odaiDocId: string
  ): Promise<KotaeResponse[]> {
    const snapshot = await db
      .collection(slackTeamId)
      .doc(odaiDocId)
      .collection(KOTAE_COLLECTION_NAME)
      .get()
    const kotaeList: KotaeResponse[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      const kotae: KotaeResponse = {
        content: data.content,
        createdBy: data.createdBy,
        votedCount: data.votedCount,
        createdAt: convertTimestamp(data.createdAt),
      }
      kotaeList.push(kotae)
    })
    return kotaeList
  }
}
