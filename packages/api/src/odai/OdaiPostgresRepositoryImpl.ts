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
  OdaiNormalPostData,
  Result,
  OdaiStatus,
} from './Odai'
import { OdaiRepository } from './OdaiRepository'
import { prismaClient } from '../prisma/client'
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
    const data: OdaiNormalPostData = {
      type: 'normal',
      title,
      dueDate: new Date(dueDate),
      createdBy,
      imageUrl: imageUrl || '',
      status: 'posting',
      createdAt: new Date(),
    }
    return prismaClient.odai
      .create({
        data: {
          ...data,
          teamId: slackTeamId,
          id,
        },
      })
      .then(() => {
        return true
      })
      .catch((e: Error) => {
        console.error(e)
        return false
      })
  }
  createIppon(): Promise<boolean> {
    // TODO: 廃止するかどうか決める
    return new Promise((resolve) => {
      resolve(true)
    })
  }
  async getCurrent({ slackTeamId }: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    const odai = await prismaClient.odai.findFirst({
      where: {
        teamId: slackTeamId,
        NOT: {
          status: 'finished',
        },
      },
    })
    if (!odai) {
      console.log('No active odai.')
      return null
    }

    return {
      ...odai,
      imageUrl: odai.imageUrl || undefined,
      // TODO: 一旦 ippon は無視
      type: odai.type as 'normal',
      dueDate: odai.dueDate.getTime(),
      status: odai.status as OdaiStatus,
      createdAt: odai.createdAt.getTime(),
    }
  }
  getRecentFinished(_params: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse | null> {
    throw new Error('Method not implemented.')
  }
  getAllFinished(_params: OdaiFinishedListParams): Promise<OdaiResponseBase[]> {
    throw new Error('Method not implemented.')
  }
  async updateStatus(params: OdaiPutStatusData, odaiId: string): Promise<boolean> {
    return prismaClient.odai
      .update({
        where: {
          id: odaiId,
        },
        data: {
          status: params.status,
        },
      })
      .then(() => {
        return true
      })
      .catch((e: Error) => {
        console.error(e)
        return false
      })
  }
  async createResult({ odaiResult }: OdaiAddResultParams): Promise<boolean> {
    const createdAt = new Date()
    const data: Result[] = [
      ...odaiResult.pointStats.map((result) => {
        return {
          id: generateId(),
          odaiId: odaiResult.id,
          kotaeId: result.kotaeId,
          type: 'point' as const,
          point: result.point,
          rank: result.rank,
          createdAt,
        }
      }),
      ...odaiResult.countStats.map((result) => {
        return {
          id: generateId(),
          odaiId: odaiResult.id,
          kotaeId: result.kotaeId,
          type: 'count' as const,
          point: result.votedCount,
          rank: result.rank,
          createdAt,
        }
      }),
    ]
    return prismaClient.result
      .createMany({
        data,
      })
      .then(() => {
        return true
      })
      .catch((e: Error) => {
        console.error(e)
        return false
      })
  }
  getAllResults(_params: OdaiGetAllResultsParams): Promise<OdaiWithResult[]> {
    throw new Error('Method not implemented.')
  }
  getResult(_params: OdaiGetResultParams): Promise<OdaiWithResult | null> {
    throw new Error('Method not implemented.')
  }
}
