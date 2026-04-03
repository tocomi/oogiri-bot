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
import { getSupabaseClient } from '../supabase/client'
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
    const { error } = await getSupabaseClient().from('Odai').insert({
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
    if (error) {
      console.error(error)
      return false
    }
    return true
  }

  async getCurrent({
    slackTeamId,
  }: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    const { data, error } = await getSupabaseClient()
      .from('Odai')
      .select('*')
      .eq('teamId', slackTeamId)
      .neq('status', 'finished')
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log('No active odai.')
        return null
      }
      console.error(error)
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
  }

  async getRecentFinished({
    slackTeamId,
  }: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse | null> {
    const { data, error } = await getSupabaseClient()
      .from('Odai')
      .select('*')
      .eq('teamId', slackTeamId)
      .eq('status', 'finished')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No finished odai.')
        return null
      }
      console.error(error)
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
  }

  getAllFinished(_params: OdaiFinishedListParams): Promise<OdaiResponseBase[]> {
    throw new Error('Method not implemented.')
  }

  async updateStatus(
    params: OdaiPutStatusData,
    odaiId: string,
  ): Promise<boolean> {
    const { error } = await getSupabaseClient()
      .from('Odai')
      .update({ status: params.status })
      .eq('id', odaiId)

    if (error) {
      console.error(error)
      return false
    }
    return true
  }

  async createResult({ odaiResult }: OdaiAddResultParams): Promise<boolean> {
    const createdAt = new Date().toISOString()
    const data: Result[] = [
      ...odaiResult.pointStats.map((result) => ({
        id: generateId(),
        odaiId: odaiResult.id,
        kotaeId: result.kotaeId,
        type: 'point' as const,
        point: result.point,
        rank: result.rank,
        createdAt: new Date(createdAt),
      })),
      ...odaiResult.countStats.map((result) => ({
        id: generateId(),
        odaiId: odaiResult.id,
        kotaeId: result.kotaeId,
        type: 'count' as const,
        point: result.votedCount,
        rank: result.rank,
        createdAt: new Date(createdAt),
      })),
    ]

    const insertData = data.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))

    const { error } = await getSupabaseClient().from('Result').insert(insertData)

    if (error) {
      console.error(error)
      return false
    }
    return true
  }

  getAllResults(_params: OdaiGetAllResultsParams): Promise<OdaiWithResult[]> {
    throw new Error('Method not implemented.')
  }

  getResult(_params: OdaiGetResultParams): Promise<OdaiWithResult | null> {
    throw new Error('Method not implemented.')
  }
}
