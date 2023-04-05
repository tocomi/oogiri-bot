import {
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiFinishedListParams,
  OdaiNormalPostRequest,
  OdaiNormalPostData,
  OdaiPutStatusData,
  OdaiRecentFinishedParams,
  OdaiRecentFinishedResponse,
  OdaiResponseBase,
  OdaiIpponPostRequest,
  OdaiIpponPostData,
} from './Odai'
import { db, convertTimestamp, createDoc } from '../firebase/firestore'
import { COLLECTION_NAME } from '../const'

export interface OdaiRepository {
  createNormal(params: OdaiNormalPostRequest): Promise<boolean>
  createIppon(params: OdaiIpponPostRequest): Promise<boolean>
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null>
  getRecentFinished(params: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse | null>
  getAllFinished(params: OdaiFinishedListParams): Promise<OdaiResponseBase[]>
  updateStatus(params: OdaiPutStatusData, odaiDocId: string): Promise<boolean>
}

const odaiCollection = (slackTeamId: string) => {
  return db.collection(COLLECTION_NAME.ROOT).doc(slackTeamId).collection(COLLECTION_NAME.ODAI)
}

export class OdaiRepositoryImpl implements OdaiRepository {
  async createNormal({
    title,
    dueDate,
    createdBy,
    imageUrl,
    slackTeamId,
  }: OdaiNormalPostRequest): Promise<boolean> {
    const data: OdaiNormalPostData = {
      type: 'normal',
      title,
      dueDate: new Date(dueDate),
      createdBy,
      imageUrl: imageUrl || '',
      status: 'posting',
      createdAt: new Date(),
    }
    const docRef = odaiCollection(slackTeamId).doc()
    const result = await createDoc<OdaiNormalPostData>(docRef, data)
    return result
  }

  async createIppon({
    title,
    createdBy,
    imageUrl,
    ipponVoteCount,
    winIpponCount,
    slackTeamId,
  }: OdaiIpponPostRequest): Promise<boolean> {
    const data: OdaiIpponPostData = {
      type: 'ippon',
      title,
      createdBy,
      imageUrl: imageUrl || '',
      ipponVoteCount,
      winIpponCount,
      status: 'posting',
      createdAt: new Date(),
    }
    const docRef = odaiCollection(slackTeamId).doc()
    const result = await createDoc<OdaiIpponPostData>(docRef, data)
    return result
  }

  async getCurrent({ slackTeamId }: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    const snapshot = await odaiCollection(slackTeamId).where('status', '!=', 'finished').get()
    if (snapshot.empty) {
      console.log('No active odai.')
      return null
    }
    const doc = snapshot.docs[0]
    return this.makeResponse(doc)
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
    return this.makeResponse(doc)
  }

  async getAllFinished({ slackTeamId }: OdaiFinishedListParams): Promise<OdaiResponseBase[]> {
    const snapshot = await odaiCollection(slackTeamId)
      .where('status', '==', 'finished')
      .orderBy('createdAt', 'desc')
      .get()
    if (snapshot.empty) {
      console.log('No finished odai.')
      return []
    }
    return snapshot.docs.map(this.makeResponse)
  }

  async updateStatus(
    { slackTeamId, status }: OdaiPutStatusData,
    odaiDocId: string
  ): Promise<boolean> {
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
    return result
  }

  private makeResponse(doc: FirebaseFirestore.QueryDocumentSnapshot): OdaiResponseBase {
    const data = doc.data()
    const responseBase = {
      docId: doc.id,
      title: data.title,
      imageUrl: data.imageUrl,
      createdBy: data.createdBy,
      status: data.status,
      createdAt: convertTimestamp(data.createdAt),
    }
    if (data.type === 'ippon') {
      return {
        type: 'ippon',
        ipponVoteCount: data.ipponVoteCount,
        winIpponCount: data.winIpponCount,
        ...responseBase,
      }
    }
    return {
      type: 'normal',
      dueDate: convertTimestamp(data.dueDate),
      ...responseBase,
    }
  }
}
