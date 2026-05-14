import { and, desc, eq, ne } from 'drizzle-orm'
import {
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
  Result,
  OdaiStatus,
} from './Odai'
import { OdaiRepository } from './OdaiRepository'
import { db } from '../db/client'
import { odai, result } from '../db/schema'
import { generateId } from '../util/generateId'

export class OdaiPostgresRepositoryImpl implements OdaiRepository {
  async createNormal({
    title,
    dueDate,
    createdBy,
    imageUrl,
    slackTeamId,
    id,
  }: OdaiNormalPostRequest): Promise<boolean> {
    try {
      await db.insert(odai).values({
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
      const rows = await db
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
      const rows = await db
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

  getAllFinished(_params: OdaiFinishedListParams): Promise<OdaiResponseBase[]> {
    throw new Error('Method not implemented.')
  }

  async updateStatus(
    params: OdaiPutStatusData,
    odaiId: string,
  ): Promise<boolean> {
    try {
      await db
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
      await db
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

  getAllResults(_params: OdaiGetAllResultsParams): Promise<OdaiWithResult[]> {
    throw new Error('Method not implemented.')
  }

  getResult(_params: OdaiGetResultParams): Promise<OdaiWithResult | null> {
    throw new Error('Method not implemented.')
  }
}
