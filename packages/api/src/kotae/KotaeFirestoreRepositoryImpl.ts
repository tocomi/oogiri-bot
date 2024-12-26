import { COLLECTION_NAME } from '../const'
import {
  KotaeByContentResponse,
  KotaeIncrementVoteCountParams,
  KotaeOfCurrentOdaiParams,
  KotaePersonalResultParams,
  KotaePostData,
  KotaePostRequestParams,
  KotaeVotedByParams,
  KotaeVotedBy,
  Kotae,
} from './Kotae'
import { KotaeRepository } from './KotaeRepository'
import { convertVoteFieldName } from './convertVoteFieldName'
import { convertTimestamp, createDoc, db, firestore } from '../firebase/firestore'

export const kotaeCollection = ({
  slackTeamId,
  odaiDocId,
}: {
  slackTeamId: string
  odaiDocId: string
}): FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData> => {
  return db
    .collection(COLLECTION_NAME.ROOT)
    .doc(slackTeamId)
    .collection(COLLECTION_NAME.ODAI)
    .doc(odaiDocId)
    .collection(COLLECTION_NAME.KOTAE)
}

const kotaeVoteCollection = ({
  slackTeamId,
  odaiDocId,
  kotaeDocId,
}: {
  slackTeamId: string
  odaiDocId: string
  kotaeDocId: string
}): FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData> => {
  return kotaeCollection({ slackTeamId, odaiDocId })
    .doc(kotaeDocId)
    .collection(COLLECTION_NAME.VOTE)
}

export class KotaeFirestoreRepositoryImpl implements KotaeRepository {
  async create(
    { content, createdBy, slackTeamId, id }: KotaePostRequestParams,
    odaiDocId: string
  ): Promise<boolean> {
    const data: KotaePostData = {
      content,
      createdBy,
      votedCount: 0,
      votedFirstCount: 0,
      votedSecondCount: 0,
      votedThirdCount: 0,
      createdAt: new Date(),
    }
    const docRef = kotaeCollection({ slackTeamId, odaiDocId }).doc(id)
    const result = await createDoc<KotaePostData>(docRef, data)
    return result
  }

  async getAllOfCurrentOdai(
    { slackTeamId }: KotaeOfCurrentOdaiParams,
    odaiDocId: string
  ): Promise<Kotae[]> {
    const snapshot = await kotaeCollection({ slackTeamId, odaiDocId }).get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        content: data.content,
        createdBy: data.createdBy,
        votedCount: data.votedCount,
        votedFirstCount: data.votedFirstCount,
        votedSecondCount: data.votedSecondCount,
        votedThirdCount: data.votedThirdCount,
        createdAt: convertTimestamp(data.createdAt),
      }
    })
  }

  async getPersonalResult(
    { slackTeamId, userId }: KotaePersonalResultParams,
    odaiDocId: string
  ): Promise<Kotae[]> {
    const snapshot = await kotaeCollection({ slackTeamId, odaiDocId })
      .where('createdBy', '==', userId)
      .get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        content: data.content,
        createdBy: data.createdBy,
        votedCount: data.votedCount,
        votedFirstCount: data.votedFirstCount,
        votedSecondCount: data.votedSecondCount,
        votedThirdCount: data.votedThirdCount,
        createdAt: convertTimestamp(data.createdAt),
      }
    })
  }

  async getVotedBy({
    slackTeamId,
    odaiDocId,
    kotaeDocId,
  }: KotaeVotedByParams): Promise<KotaeVotedBy[]> {
    const snapshot = await kotaeVoteCollection({ slackTeamId, odaiDocId, kotaeDocId }).get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        votedBy: data.votedBy,
        rank: data.rank,
        createdAt: convertTimestamp(data.createdAt),
      }
    })
  }

  async getByContent({
    slackTeamId,
    content,
    odaiDocId,
  }: KotaeIncrementVoteCountParams & {
    odaiDocId: string
  }): Promise<KotaeByContentResponse | null> {
    const kotaeSnapshot = await kotaeCollection({ slackTeamId, odaiDocId })
      .where('content', '==', content)
      .get()
    if (kotaeSnapshot.empty) {
      console.log('No target kotae.')
      console.log({ slackTeamId, content })
      return null
    }

    // NOTE: 同じ内容の回答がある可能性は考慮していない
    const kotaeDoc = kotaeSnapshot.docs[0]

    const data = kotaeDoc.data()
    return {
      id: kotaeDoc.id,
      content: data.content,
      createdBy: data.createdBy,
      votedCount: data.votedCount,
      votedFirstCount: data.votedFirstCount,
      votedSecondCount: data.votedSecondCount,
      votedThirdCount: data.votedThirdCount,
      createdAt: convertTimestamp(data.createdAt),
    }
  }

  async incrementVoteCount({
    slackTeamId,
    odaiDocId,
    kotaeDocId,
    rank,
  }: Pick<KotaeIncrementVoteCountParams, 'slackTeamId' | 'rank'> & {
    odaiDocId: string
    kotaeDocId: string
  }): Promise<boolean> {
    const kotaeRef = kotaeCollection({ slackTeamId, odaiDocId }).doc(kotaeDocId)
    const fieldName = convertVoteFieldName(rank)
    const updateObject: Record<string, unknown> = {}
    updateObject[fieldName] = firestore.FieldValue.increment(1)
    return kotaeRef
      .update({
        votedCount: firestore.FieldValue.increment(1),
        ...updateObject,
      })
      .then(() => true)
      .catch((error) => {
        console.error(error)
        return false
      })
  }
}
