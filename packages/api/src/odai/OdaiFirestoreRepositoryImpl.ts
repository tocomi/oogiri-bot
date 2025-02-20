import { COLLECTION_NAME } from '../const'
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
  OdaiAddResultParams,
  OdaiGetResultParams,
  OdaiWithResult,
} from './Odai'
import { OdaiRepository } from './OdaiRepository'
import { db, convertTimestamp, createDoc } from '../firebase/firestore'

const odaiCollection = (slackTeamId: string) => {
  return db.collection(COLLECTION_NAME.ROOT).doc(slackTeamId).collection(COLLECTION_NAME.ODAI)
}

export class OdaiFirestoreRepositoryImpl implements OdaiRepository {
  async createNormal({
    title,
    dueDate,
    createdBy,
    imageUrl,
    slackTeamId,
    id,
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
    const docRef = odaiCollection(slackTeamId).doc(id)
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

  async createResult({ slackTeamId, odaiResult }: OdaiAddResultParams): Promise<boolean> {
    const docRef = odaiCollection(slackTeamId).doc(odaiResult.id)
    const success = await docRef
      .update({
        result: {
          kotaeCount: odaiResult.kotaeCount,
          voteCount: odaiResult.voteCount,
          pointStats: odaiResult.pointStats,
          countStats: odaiResult.countStats,
        },
      })
      .then(() => true)
      .catch((error) => {
        console.error(error)
        return false
      })
    return success
  }

  async getAllResults({ slackTeamId }: { slackTeamId: string }): Promise<OdaiWithResult[]> {
    const snapshot = await odaiCollection(slackTeamId).where('result', '!=', null).get()
    if (snapshot.empty) {
      console.error('No odai having result.')
      return []
    }
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        type: 'normal',
        id: doc.id,
        title: data.title,
        imageUrl: data.imageUrl,
        createdBy: data.createdBy,
        dueDate: convertTimestamp(data.dueDate),
        kotaeCount: data.result.kotaeCount,
        voteCount: data.result.voteCount,
        pointStats: data.result.pointStats,
        countStats: data.result.countStats,
      }
    })
  }

  async getResult({ slackTeamId, odaiId }: OdaiGetResultParams): Promise<OdaiWithResult | null> {
    const snapshot = await odaiCollection(slackTeamId).doc(odaiId).get()
    if (!snapshot.exists) {
      console.error(`No odai id: ${odaiId}`)
      return null
    }
    const data = snapshot.data()
    if (!data?.result) {
      console.error(`No result in odai: ${odaiId}`)
      return null
    }
    return {
      id: snapshot.id,
      title: data.title,
      imageUrl: data.imageUrl,
      createdBy: data.createdBy,
      dueDate: convertTimestamp(data.dueDate),
      kotaeCount: data.result.kotaeCount,
      voteCount: data.result.voteCount,
      pointStats: data.result.pointStats,
      countStats: data.result.countStats,
    }
  }

  private makeResponse(doc: FirebaseFirestore.QueryDocumentSnapshot): OdaiResponseBase {
    const data = doc.data()
    const responseBase = {
      id: doc.id,
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
