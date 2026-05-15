import { eq } from 'drizzle-orm'
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
import { vote } from '../db/schema'

export class VotePostgresRepositoryImpl implements VoteRepository {
  checkDuplication(
    _params: VoteCheckDuplicationParams,
  ): Promise<'ok' | 'alreadyVoted' | 'alreadySameRankVoted'> {
    throw new Error('Method not implemented.')
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

  getAllByUser(_params: VoteCountByUserParams): Promise<Vote[]> {
    throw new Error('Method not implemented.')
  }
}
