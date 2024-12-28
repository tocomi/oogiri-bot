import { COLLECTION_NAME } from '../const'
import {
  Vote,
  VoteCountByUserParams,
  VoteOfCurrentOdaiParams,
  VoteCreateRequest,
  VoteCheckDuplicationParams,
} from './Vote'
import { VoteRepository } from './VoteRepository'
import { convertTimestamp, createDoc, db } from '../firebase/firestore'

const voteKotaeCollection = ({
  slackTeamId,
  odaiDocId,
  kotaeDocId,
}: {
  slackTeamId: string
  odaiDocId: string
  kotaeDocId: string
}) => {
  return db
    .collection(COLLECTION_NAME.ROOT)
    .doc(slackTeamId)
    .collection(COLLECTION_NAME.ODAI)
    .doc(odaiDocId)
    .collection(COLLECTION_NAME.KOTAE)
    .doc(kotaeDocId)
    .collection(COLLECTION_NAME.VOTE)
}

const voteOdaiCollection = ({
  slackTeamId,
  odaiDocId,
}: {
  slackTeamId: string
  odaiDocId: string
}) => {
  return db
    .collection(COLLECTION_NAME.ROOT)
    .doc(slackTeamId)
    .collection(COLLECTION_NAME.ODAI)
    .doc(odaiDocId)
    .collection(COLLECTION_NAME.VOTE)
}

export class VoteFirestoreRepositoryImpl implements VoteRepository {
  async checkDuplication({
    slackTeamId,
    votedBy,
    rank,
    odaiId,
    kotaeId,
  }: VoteCheckDuplicationParams): Promise<'ok' | 'alreadyVoted' | 'alreadySameRankVoted'> {
    const collection = voteKotaeCollection({
      slackTeamId,
      odaiDocId: odaiId,
      kotaeDocId: kotaeId,
    })

    // NOTE: 同一ユーザーが同じ回答に複数投票することはできない
    const voteSnapshot = await collection.where('votedBy', '==', votedBy).get()
    if (!voteSnapshot.empty) {
      console.log('Already voted.')
      return 'alreadyVoted'
    }

    // NOTE: rank = 1 or 2は同じお題で複数投票することはできない
    if (rank === 1 || rank === 2) {
      const odaiCollection = voteOdaiCollection({ slackTeamId, odaiDocId: odaiId })
      const voteRankSnapshot = await odaiCollection
        .where('votedBy', '==', votedBy)
        .where('rank', '==', rank)
        .get()
      if (!voteRankSnapshot.empty) {
        console.log('Already same rank voted.')
        return 'alreadySameRankVoted'
      }
    }
    return 'ok'
  }

  async create({
    id,
    slackTeamId,
    content,
    votedBy,
    rank,
    odaiId,
    kotaeId,
    kotaeCreatedBy,
  }: VoteCreateRequest & {
    odaiId: string
    kotaeId: string
    kotaeCreatedBy: string
  }): Promise<Vote> {
    const collection = voteKotaeCollection({
      slackTeamId,
      odaiDocId: odaiId,
      kotaeDocId: kotaeId,
    })

    const data: Vote = {
      votedBy,
      rank,
      createdAt: new Date(),
      kotaeId: kotaeId,
      kotaeContent: content,
      kotaeCreatedBy,
    }

    // NOTE: odaiのサブコレクションvoteにドキュメント追加(投票参加者のカウント用)
    const newOdaiVoteRef = voteOdaiCollection({
      slackTeamId,
      odaiDocId: odaiId,
    }).doc(id)
    await createDoc<Vote>(newOdaiVoteRef, data)

    // NOTE: kotaeのサブコレクションvoteにドキュメントを追加(重複投票のチェック用)
    const newKotaeVoteRef = collection.doc(id)
    await createDoc<Vote>(newKotaeVoteRef, data)

    return data
  }

  async getAllOfCurrentOdai(
    { slackTeamId }: VoteOfCurrentOdaiParams,
    odaiDocId: string
  ): Promise<Vote[]> {
    const snapshot = await voteOdaiCollection({
      slackTeamId,
      odaiDocId,
    }).get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        votedBy: data.votedBy,
        rank: data.rank,
        createdAt: convertTimestamp(data.createdAt),
        kotaeId: data.kotaeId,
        kotaeContent: data.kotaeContent,
        kotaeCreatedBy: data.kotaeCreatedBy,
      }
    })
  }

  async getAllByUser({ userId }: VoteCountByUserParams): Promise<Vote[]> {
    const snapshot = await db
      .collectionGroup(COLLECTION_NAME.VOTE)
      .where('kotaeCreatedBy', '==', userId)
      .get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        votedBy: data.votedBy,
        rank: data.rank,
        createdAt: convertTimestamp(data.createdAt),
        kotaeId: data.kotaeId,
        kotaeContent: data.kotaeContent,
        kotaeCreatedBy: data.kotaeCreatedBy,
      }
    })
  }
}
