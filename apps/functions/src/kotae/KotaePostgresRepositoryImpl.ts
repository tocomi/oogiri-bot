import { and, count, eq, inArray } from 'drizzle-orm'

import { SlackParams } from '../api/Api'
import { db as defaultDb } from '../db/client'
import { kotae, odai, vote } from '../db/schema'
import {
  KotaePostRequestParams,
  KotaeOfCurrentOdaiParams,
  KotaePersonalResultParams,
  KotaeVotedByParams,
  KotaeVotedBy,
  KotaeByContentParams,
  KotaeByContentResponse,
  KotaeIncrementVoteCountParams,
  Kotae,
} from './Kotae'
import { KotaeRepository } from './KotaeRepository'

type Db = typeof defaultDb

export class KotaePostgresRepositoryImpl implements KotaeRepository {
  private db: Db

  constructor(db: Db = defaultDb) {
    this.db = db
  }

  /**
   * 投稿されている答えの総数を Postgres から取得する
   */
  async countAll({ slackTeamId }: SlackParams): Promise<number | null> {
    try {
      const rows = await this.db
        .select({ count: count() })
        .from(kotae)
        .innerJoin(odai, eq(kotae.odaiId, odai.id))
        .where(eq(odai.teamId, slackTeamId))
      return rows[0].count
    } catch (error) {
      console.error(error)
      return null
    }
  }

  /**
   * 指定お題に紐づく答えの件数を Postgres から取得する
   */
  async countByOdaiId({ odaiId }: { odaiId: string }): Promise<number | null> {
    try {
      const rows = await this.db
        .select({ count: count() })
        .from(kotae)
        .where(eq(kotae.odaiId, odaiId))
      return rows[0].count
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async create(
    { content, createdBy, id }: KotaePostRequestParams,
    odaiId: string,
  ): Promise<boolean> {
    try {
      await this.db.insert(kotae).values({
        id,
        odaiId,
        content,
        createdBy,
        createdAt: new Date().toISOString(),
      })
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  async getAllOfCurrentOdai(
    _params: KotaeOfCurrentOdaiParams,
    odaiId: string,
  ): Promise<Kotae[]> {
    const [kotaes, votes] = await Promise.all([
      this.db.select().from(kotae).where(eq(kotae.odaiId, odaiId)),
      this.db
        .select({ kotaeId: vote.kotaeId, rank: vote.rank })
        .from(vote)
        .where(eq(vote.odaiId, odaiId)),
    ])

    return kotaes.map((k) => {
      const kotaeVotes = votes.filter((v) => v.kotaeId === k.id)
      return {
        id: k.id,
        content: k.content,
        createdBy: k.createdBy,
        votedCount: kotaeVotes.length,
        votedFirstCount: kotaeVotes.filter((v) => v.rank === 1).length,
        votedSecondCount: kotaeVotes.filter((v) => v.rank === 2).length,
        votedThirdCount: kotaeVotes.filter((v) => v.rank === 3).length,
        createdAt: new Date(k.createdAt).getTime(),
      }
    })
  }

  async getPersonalResult(
    { userId }: KotaePersonalResultParams,
    odaiId: string,
  ): Promise<Kotae[]> {
    const kotaes = await this.db
      .select()
      .from(kotae)
      .where(and(eq(kotae.odaiId, odaiId), eq(kotae.createdBy, userId)))

    const kotaeIds = kotaes.map((k) => k.id)
    if (kotaeIds.length === 0) return []

    const votes = await this.db
      .select({ kotaeId: vote.kotaeId, rank: vote.rank })
      .from(vote)
      .where(inArray(vote.kotaeId, kotaeIds))

    return kotaes.map((k) => {
      const kotaeVotes = votes.filter((v) => v.kotaeId === k.id)
      return {
        id: k.id,
        content: k.content,
        createdBy: k.createdBy,
        votedCount: kotaeVotes.length,
        votedFirstCount: kotaeVotes.filter((v) => v.rank === 1).length,
        votedSecondCount: kotaeVotes.filter((v) => v.rank === 2).length,
        votedThirdCount: kotaeVotes.filter((v) => v.rank === 3).length,
        createdAt: new Date(k.createdAt).getTime(),
      }
    })
  }

  async getVotedBy({
    kotaeDocId,
  }: KotaeVotedByParams): Promise<KotaeVotedBy[]> {
    try {
      const rows = await this.db
        .select({
          createdBy: vote.createdBy,
          rank: vote.rank,
          createdAt: vote.createdAt,
        })
        .from(vote)
        .where(eq(vote.kotaeId, kotaeDocId))

      return rows.map((v) => ({
        votedBy: v.createdBy,
        rank: v.rank as KotaeVotedBy['rank'],
        createdAt: new Date(v.createdAt).getTime(),
      }))
    } catch (error) {
      console.error(error)
      return []
    }
  }

  async getByContent({
    content,
    odaiDocId,
  }: KotaeByContentParams & {
    odaiDocId: string
  }): Promise<KotaeByContentResponse | null> {
    try {
      const rows = await this.db
        .select()
        .from(kotae)
        .where(and(eq(kotae.odaiId, odaiDocId), eq(kotae.content, content)))
        .limit(1)

      const data = rows[0]
      if (!data) {
        console.log('No target kotae.')
        return null
      }

      const votes = await this.db
        .select({ rank: vote.rank })
        .from(vote)
        .where(eq(vote.kotaeId, data.id))

      return {
        id: data.id,
        content: data.content,
        createdBy: data.createdBy,
        votedCount: votes.length,
        votedFirstCount: votes.filter((v) => v.rank === 1).length,
        votedSecondCount: votes.filter((v) => v.rank === 2).length,
        votedThirdCount: votes.filter((v) => v.rank === 3).length,
        createdAt: new Date(data.createdAt).getTime(),
      }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  // Postgres では votedCount は vote テーブルから動的に集計するため no-op
  async incrementVoteCount(
    _params: Pick<KotaeIncrementVoteCountParams, 'slackTeamId' | 'rank'> & {
      odaiDocId: string
      kotaeDocId: string
    },
  ): Promise<boolean> {
    return true
  }
}
