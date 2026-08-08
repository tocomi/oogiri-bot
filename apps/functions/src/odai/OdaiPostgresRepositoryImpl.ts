import { and, count, desc, eq, inArray, ne } from 'drizzle-orm'

import { db as defaultDb } from '../db/client'
import { kotae, odai, result, vote } from '../db/schema'
import { generateId } from '../util/generateId'
import {
  CountStat,
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiFinishedListParams,
  OdaiNormalPostRequest,
  OdaiPutStatusData,
  OdaiRecentFinishedParams,
  OdaiRecentFinishedResponse,
  OdaiResponseBase,
  OdaiAddResultParams,
  OdaiGetResultParams,
  OdaiWithResult,
  OdaiGetAllResultsParams,
  PointStat,
  Result,
  OdaiStatus,
} from './Odai'
import { OdaiRepository } from './OdaiRepository'

type Db = typeof defaultDb

export class OdaiPostgresRepositoryImpl implements OdaiRepository {
  private db: Db

  constructor(db: Db = defaultDb) {
    this.db = db
  }

  async createNormal({
    title,
    dueDate,
    createdBy,
    imageUrl,
    slackTeamId,
    id,
  }: OdaiNormalPostRequest): Promise<boolean> {
    try {
      await this.db.insert(odai).values({
        id,
        teamId: slackTeamId,
        title,
        type: 'normal',
        status: 'posting',
        dueDate: new Date(dueDate).toISOString(),
        imageUrl: imageUrl || null,
        createdBy,
        createdAt: new Date().toISOString(),
      })
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  async getCurrent({
    slackTeamId,
  }: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    try {
      const rows = await this.db
        .select()
        .from(odai)
        .where(and(eq(odai.teamId, slackTeamId), ne(odai.status, 'finished')))
        .limit(1)

      const data = rows[0]
      if (!data) {
        console.log('No active odai.')
        return null
      }

      return {
        ...data,
        imageUrl: data.imageUrl || undefined,
        type: data.type as 'normal',
        dueDate: new Date(data.dueDate).getTime(),
        status: data.status as OdaiStatus,
        createdAt: new Date(data.createdAt).getTime(),
      }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async getRecentFinished({
    slackTeamId,
  }: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse | null> {
    try {
      const rows = await this.db
        .select()
        .from(odai)
        .where(and(eq(odai.teamId, slackTeamId), eq(odai.status, 'finished')))
        .orderBy(desc(odai.createdAt))
        .limit(1)

      const data = rows[0]
      if (!data) {
        console.log('No finished odai.')
        return null
      }

      return {
        ...data,
        imageUrl: data.imageUrl || undefined,
        type: data.type as 'normal',
        dueDate: new Date(data.dueDate).getTime(),
        status: data.status as OdaiStatus,
        createdAt: new Date(data.createdAt).getTime(),
      }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async getAllFinished({
    slackTeamId,
  }: OdaiFinishedListParams): Promise<OdaiResponseBase[]> {
    try {
      const rows = await this.db
        .select()
        .from(odai)
        .where(and(eq(odai.teamId, slackTeamId), eq(odai.status, 'finished')))
        .orderBy(desc(odai.createdAt))

      return rows.map((data) => ({
        id: data.id,
        type: 'normal' as const,
        title: data.title,
        imageUrl: data.imageUrl || undefined,
        createdBy: data.createdBy,
        status: data.status as OdaiStatus,
        dueDate: new Date(data.dueDate).getTime(),
        createdAt: new Date(data.createdAt).getTime(),
      }))
    } catch (error) {
      console.error(error)
      return []
    }
  }

  async updateStatus(
    params: OdaiPutStatusData,
    odaiId: string,
  ): Promise<boolean> {
    try {
      await this.db
        .update(odai)
        .set({ status: params.status })
        .where(eq(odai.id, odaiId))
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  async createResult({ odaiResult }: OdaiAddResultParams): Promise<boolean> {
    const createdAt = new Date().toISOString()
    const data: Result[] = [
      ...odaiResult.pointStats.map((r) => ({
        id: generateId(),
        odaiId: odaiResult.id,
        kotaeId: r.kotaeId,
        type: 'point' as const,
        point: r.point,
        rank: r.rank,
        createdAt: new Date(createdAt),
      })),
      ...odaiResult.countStats.map((r) => ({
        id: generateId(),
        odaiId: odaiResult.id,
        kotaeId: r.kotaeId,
        type: 'count' as const,
        point: r.votedCount,
        rank: r.rank,
        createdAt: new Date(createdAt),
      })),
    ]

    try {
      await this.db
        .insert(result)
        .values(
          data.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
        )
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  async getAllResults({
    slackTeamId,
  }: OdaiGetAllResultsParams): Promise<OdaiWithResult[]> {
    try {
      const odaiRows = await this.db
        .select()
        .from(odai)
        .where(and(eq(odai.teamId, slackTeamId), eq(odai.status, 'finished')))

      if (!odaiRows.length) return []

      const odaiIds = odaiRows.map((o) => o.id)

      const [kotaeCounts, voteCounts] = await Promise.all([
        this.db
          .select({ odaiId: kotae.odaiId, count: count() })
          .from(kotae)
          .where(inArray(kotae.odaiId, odaiIds))
          .groupBy(kotae.odaiId),
        this.db
          .select({ odaiId: vote.odaiId, count: count() })
          .from(vote)
          .where(inArray(vote.odaiId, odaiIds))
          .groupBy(vote.odaiId),
      ])

      return odaiRows.map((o) => ({
        id: o.id,
        title: o.title,
        imageUrl: o.imageUrl || undefined,
        createdBy: o.createdBy,
        dueDate: new Date(o.dueDate).getTime(),
        kotaeCount: kotaeCounts.find((k) => k.odaiId === o.id)?.count ?? 0,
        voteCount: voteCounts.find((v) => v.odaiId === o.id)?.count ?? 0,
        pointStats: [],
        countStats: [],
      }))
    } catch (error) {
      console.error(error)
      return []
    }
  }

  async getResult({
    slackTeamId,
    odaiId,
  }: OdaiGetResultParams): Promise<OdaiWithResult | null> {
    try {
      const odaiRows = await this.db
        .select()
        .from(odai)
        .where(and(eq(odai.id, odaiId), eq(odai.teamId, slackTeamId)))
        .limit(1)

      const odaiData = odaiRows[0]
      if (!odaiData) return null

      const [results, kotaes, votes] = await Promise.all([
        this.db.select().from(result).where(eq(result.odaiId, odaiId)),
        this.db.select().from(kotae).where(eq(kotae.odaiId, odaiId)),
        this.db.select().from(vote).where(eq(vote.odaiId, odaiId)),
      ])

      if (!results.length) return null

      const pointStats: PointStat[] = results
        .filter((r) => r.type === 'point')
        .map((r) => {
          const k = kotaes.find((k) => k.id === r.kotaeId)
          const kotaeVotes = votes.filter((v) => v.kotaeId === r.kotaeId)
          return {
            type: 'point' as const,
            kotaeId: r.kotaeId,
            kotaeContent: k?.content ?? '',
            userName: k?.createdBy ?? '',
            point: r.point,
            rank: r.rank as 1 | 2 | 3,
            votedFirstCount: kotaeVotes.filter((v) => v.rank === 1).length,
            votedSecondCount: kotaeVotes.filter((v) => v.rank === 2).length,
            votedThirdCount: kotaeVotes.filter((v) => v.rank === 3).length,
          }
        })

      const countStats: CountStat[] = results
        .filter((r) => r.type === 'count')
        .map((r) => {
          const k = kotaes.find((k) => k.id === r.kotaeId)
          return {
            type: 'count' as const,
            kotaeId: r.kotaeId,
            kotaeContent: k?.content ?? '',
            userName: k?.createdBy ?? '',
            rank: r.rank as 1 | 2 | 3,
            votedCount: r.point,
          }
        })

      return {
        id: odaiData.id,
        title: odaiData.title,
        imageUrl: odaiData.imageUrl || undefined,
        createdBy: odaiData.createdBy,
        dueDate: new Date(odaiData.dueDate).getTime(),
        kotaeCount: kotaes.length,
        voteCount: votes.length,
        pointStats,
        countStats,
      }
    } catch (error) {
      console.error(error)
      return null
    }
  }
}
