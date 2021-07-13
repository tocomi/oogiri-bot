import { createDoc, db, firestore } from '../firebase/firestore'
import { VoteApiStatus, VotePostData, VoteRequestParams } from './Vote'

const VOTE_COLLECTION_NAME = 'vote'
const KOTAE_COLLECTION_NAME = 'kotae'

export interface VoteRepository {
  create(params: VoteRequestParams, odaiDocId: string): Promise<VoteApiStatus>
}

export class VoteRepositoryImpl implements VoteRepository {
  async create(
    { slackTeamId, content, votedBy }: VoteRequestParams,
    odaiDocId: string
  ): Promise<VoteApiStatus> {
    const kotaeSnapshot = await db
      .collection(slackTeamId)
      .doc(odaiDocId)
      .collection(KOTAE_COLLECTION_NAME)
      .where('content', '==', content)
      .get()
    if (kotaeSnapshot.empty) {
      console.log('No target kotae.')
      console.log({ slackTeamId, content, votedBy })
      return 'noKotae'
    }
    // NOTE: 同じ内容の回答がある可能性は考慮していない
    const kotaeRef = kotaeSnapshot.docs[0].ref

    // NOTE: 同一ユーザーが同じ回答に複数投票することはできない
    const voteCollection = kotaeRef.collection(VOTE_COLLECTION_NAME)
    const voteSnapshot = await voteCollection.where('votedBy', '==', votedBy).get()
    if (!voteSnapshot.empty) {
      console.log('Already voted.')
      return 'alreadyVoted'
    }

    // NOTE: kotaeのvotedCountをインクリメント
    await kotaeRef.update({
      votedCount: firestore.FieldValue.increment(1),
    })

    // NOTE: kotaeのサブコレクションvoteにドキュメントを追加
    const data: VotePostData = {
      votedBy,
      createdAt: new Date(),
    }
    const newVoteRef = voteCollection.doc()
    const result = await createDoc<VotePostData>(newVoteRef, data)
    return result ? 'ok' : 'error'
  }
}
