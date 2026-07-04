import { and, count, eq } from 'drizzle-orm'

import { SlackParams } from '../api/Api'
import { db as defaultDb } from '../db/client'
import { kotae, odai, vote } from '../db/schema'
import {
  VoteCreateRequest,
  Vote,
  VoteOfCurrentOdaiParams,
  VoteCountByUserParams,
  VoteCheckDuplicationParams,
  VoteOfCurrentOdaiResponse,
} from './Vote'
import { VoteRepository } from './VoteRepository'

type Db = typeof defaultDb

export class VotePostgresRepositoryImpl implements VoteRepository {
  private db: Db

  constructor(db: Db = defaultDb) {
    this.db = db
  }

  /**
   * 投稿されている投票の総数を Postgres から取得する
   */
  async countAll({ slackTeamId }: SlackParams): Promise<number | null> {
    try {
      const rows = await this.db
        .select({ count: count() })
        .from(vote)
        .innerJoin(odai, eq(vote.odaiId, odai.id))
        .where(eq(odai.teamId, slackTeamId))
      return rows[0].count
    } catch (error) {
      console.error(error)
      return null
    }
  }

  /**
   * 指定お題に紐づく投票の件数を Postgres から取得する
   */
  async countByOdaiId({ odaiId }: { odaiId: string }): Promise<number | null> {
    try {
      const rows = await this.db
        .select({ count: count() })
        .from(vote)
        .where(eq(vote.odaiId, odaiId))
      return rows[0].count
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async checkDuplication({
    votedBy,
    rank,
    odaiId,
    kotaeId,
  }: VoteCheckDuplicationParams): Promise<
    'ok' | 'alreadyVoted' | 'alreadySameRankVoted'
  > {
    const alreadyVoted = await this.db
      .select()
      .from(vote)
      .where(and(eq(vote.kotaeId, kotaeId), eq(vote.createdBy, votedBy)))
      .limit(1)

    if (alreadyVoted.length) {
      console.log('Already voted.')
      return 'alreadyVoted'
    }

    if (rank === 1 || rank === 2) {
      const sameRankVote = await this.db
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
      await this.db.insert(vote).values({
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
