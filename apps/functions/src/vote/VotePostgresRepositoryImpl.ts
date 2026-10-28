import { and, eq } from 'drizzle-orm'

import { db as defaultDb } from '../db/client'
import { kotae, vote } from '../db/schema'
import {
  MyVote,
  MyVotesOfOdaiParams,
  Vote,
  VoteOfCurrentOdaiParams,
  VoteCountByUserParams,
  VoteOfCurrentOdaiResponse,
  VoteRank,
} from './Vote'
import { VoteRepository, VoteSaveParams } from './VoteRepository'

type Db = typeof defaultDb
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

export class VotePostgresRepositoryImpl implements VoteRepository {
  private db: Db

  constructor(db: Db = defaultDb) {
    this.db = db
  }

  async getMyVotesOfOdai({
    votedBy,
    odaiId,
  }: MyVotesOfOdaiParams): Promise<MyVote[]> {
    const rows = await this.db
      .select({
        id: vote.id,
        kotaeId: vote.kotaeId,
        kotaeContent: kotae.content,
        rank: vote.rank,
      })
      .from(vote)
      .innerJoin(kotae, eq(vote.kotaeId, kotae.id))
      .where(and(eq(vote.odaiId, odaiId), eq(vote.createdBy, votedBy)))

    return rows.map((v) => ({ ...v, rank: v.rank as VoteRank }))
  }

  async save({
    id,
    content,
    votedBy,
    rank,
    odaiId,
    kotaeId,
    kotaeCreatedBy,
    currentVoteId,
    demotedVotes,
  }: VoteSaveParams): Promise<Vote> {
    const createdAt = new Date()
    const write = async (executor: Db | Tx) => {
      if (currentVoteId) {
        await executor
          .update(vote)
          .set({ rank })
          .where(eq(vote.id, currentVoteId))
      } else {
        await executor.insert(vote).values({
          id,
          odaiId,
          kotaeId,
          rank,
          createdBy: votedBy,
          createdAt: createdAt.toISOString(),
        })
      }
      for (const demoted of demotedVotes) {
        await executor
          .update(vote)
          .set({ rank: demoted.to })
          .where(eq(vote.id, demoted.id))
      }
    }

    try {
      // NOTE: 書き込みが1回で済む通常の投票ではトランザクションを張らず往復を増やさない
      if (demotedVotes.length) {
        await this.db.transaction(write)
      } else {
        await write(this.db)
      }
    } catch (error) {
      console.error(error)
      throw error
    }
    return {
      votedBy,
      rank,
      kotaeId,
      kotaeCreatedBy,
      createdAt,
      kotaeContent: content,
    }
  }

  async getAllOfCurrentOdai(
    _params: VoteOfCurrentOdaiParams,
    odaiId: string,
  ): Promise<VoteOfCurrentOdaiResponse> {
    try {
      const rows = await this.db
        .select()
        .from(vote)
        .where(eq(vote.odaiId, odaiId))

      return rows.map((v) => ({
        votedBy: v.createdBy,
        rank: v.rank as Vote['rank'],
        kotaeId: v.kotaeId,
        kotaeCreatedBy: v.createdBy,
        createdAt: new Date(v.createdAt),
      }))
    } catch (error) {
      console.error(error)
      return []
    }
  }

  async getAllByUser({ userId }: VoteCountByUserParams): Promise<Vote[]> {
    try {
      const rows = await this.db
        .select({
          votedBy: vote.createdBy,
          rank: vote.rank,
          createdAt: vote.createdAt,
          kotaeId: vote.kotaeId,
          kotaeContent: kotae.content,
        })
        .from(vote)
        .innerJoin(kotae, eq(vote.kotaeId, kotae.id))
        .where(eq(kotae.createdBy, userId))

      return rows.map((v) => ({
        votedBy: v.votedBy,
        rank: v.rank as Vote['rank'],
        createdAt: new Date(v.createdAt).getTime(),
        kotaeId: v.kotaeId,
        kotaeContent: v.kotaeContent,
        kotaeCreatedBy: userId,
      }))
    } catch (error) {
      console.error(error)
      return []
    }
  }
}
