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
} from './Odai'
import { OdaiRepository } from './OdaiRepository'
import { prismaClient } from '../prisma/client'

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
  getCurrent(_params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    throw new Error('Method not implemented.')
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
  addResultField(_params: OdaiAddResultParams): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  getAllResults(_params: OdaiGetAllResultsParams): Promise<OdaiWithResult[]> {
    throw new Error('Method not implemented.')
  }
  getResult(_params: OdaiGetResultParams): Promise<OdaiWithResult | null> {
    throw new Error('Method not implemented.')
  }
}
