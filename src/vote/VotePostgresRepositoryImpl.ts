import { and, eq } from 'drizzle-orm'
import {
  VoteCreateRequest,
  Vote,
  VoteOfCurrentOdaiParams,
  VoteCountByUserParams,
  VoteCheckDuplicationParams,
  VoteOfCurrentOdaiResponse,
} from './Vote'
import { VoteRepository } from './VoteRepository'
import { db } from '../db/client'
import { kotae, vote } from '../db/schema'

export class VotePostgresRepositoryImpl implements VoteRepository {
  async checkDuplication({
    votedBy,
    rank,
    odaiId,
    kotaeId,
  }: VoteCheckDuplicationParams): Promise<
    'ok' | 'alreadyVoted' | 'alreadySameRankVoted'
  > {
    const alreadyVoted = await db
      .select()
      .from(vote)
      .where(and(eq(vote.kotaeId, kotaeId), eq(vote.createdBy, votedBy)))
      .limit(1)

    if (alreadyVoted.length) {
      console.log('Already voted.')
      return 'alreadyVoted'
    }

    if (rank === 1 || rank === 2) {
      const sameRankVote = await db
        .select()
        .from(vote)
        .where(
          and(
            eq(vote.odaiId, odaiId),
            eq(vote.createdBy, votedBy),
            eq(vote.rank, rank),
          ),
        )
        .limit(1)

      if (sameRankVote.length) {
        console.log('Already same rank voted.')
        return 'alreadySameRankVoted'
      }
    }

    return 'ok'
  }

  async create({
    id,
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
    const createdAt = new Date()
    try {
      await db.insert(vote).values({
        id,
        odaiId,
        kotaeId,
        rank,
        createdBy: votedBy,
        createdAt: createdAt.toISOString(),
      })
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
      const rows = await db.select().from(vote).where(eq(vote.odaiId, odaiId))

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
      const rows = await db
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
