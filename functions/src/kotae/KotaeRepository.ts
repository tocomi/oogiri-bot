import { createDoc, db } from '../firebase/firestore'
import { KotaeApiStatus, KotaePostData, KotaePostRequestParams } from './Kotae'

const KOTAE_COLLECTION_NAME = 'kotae'

export interface KotaeRepository {
  create(params: KotaePostRequestParams, odaiDocId: string): Promise<KotaeApiStatus>
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
}
