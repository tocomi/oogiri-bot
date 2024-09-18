import { v7 as uuidv7 } from 'uuid'
import { prismaClient } from '../prisma/client'
import {
  OdaiCurrentParams,
  OdaiCurrentResponse,
  OdaiFinishedListParams,
  OdaiNormalPostRequest,
  OdaiPutStatusData,
  OdaiRecentFinishedParams,
  OdaiRecentFinishedResponse,
  OdaiResponseBase,
  OdaiIpponPostRequest,
  OdaiAddResultParams,
  OdaiGetResultParams,
  OdaiWithResult,
  OdaiGetAllResultsParams,
  OdaiNormalPostData,
} from './Odai'
import { OdaiRepository } from './OdaiRepository'

export class OdaiPostgresRepositoryImpl implements OdaiRepository {
  createNormal({
    title,
    dueDate,
    createdBy,
    imageUrl,
    slackTeamId,
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
          id: uuidv7(),
        },
      })
      .then(() => {
        return true
      })
      .catch((e) => {
        console.error(e)
        return false
      })
  }
  createIppon(params: OdaiIpponPostRequest): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  getCurrent(params: OdaiCurrentParams): Promise<OdaiCurrentResponse | null> {
    throw new Error('Method not implemented.')
  }
  getRecentFinished(params: OdaiRecentFinishedParams): Promise<OdaiRecentFinishedResponse | null> {
    throw new Error('Method not implemented.')
  }
  getAllFinished(params: OdaiFinishedListParams): Promise<OdaiResponseBase[]> {
    throw new Error('Method not implemented.')
  }
  updateStatus(params: OdaiPutStatusData, odaiDocId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  addResultField(params: OdaiAddResultParams): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  getAllResults(params: OdaiGetAllResultsParams): Promise<OdaiWithResult[]> {
    throw new Error('Method not implemented.')
  }
  getResult(params: OdaiGetResultParams): Promise<OdaiWithResult | null> {
    throw new Error('Method not implemented.')
  }
}
