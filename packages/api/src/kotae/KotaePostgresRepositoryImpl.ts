import {
  KotaePostRequestParams,
  KotaeOfCurrentOdaiParams,
  KotaeResponse,
  KotaePersonalResultParams,
  KotaeVotedByParams,
  KotaeVotedBy,
  KotaeByContentParams,
  KotaeByContentResponse,
  KotaeIncrementVoteCountParams,
} from './Kotae'
import { KotaeRepository } from './KotaeRepository'
import { prismaClient } from '../prisma/client'

export class KotaePostgresRepositoryImpl implements KotaeRepository {
  async create(
    { content, createdBy, id }: KotaePostRequestParams,
    odaiId: string
  ): Promise<boolean> {
    return prismaClient.kotae
      .create({
        data: {
          content,
          createdBy,
          createdAt: new Date(),
          odaiId,
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
  getAllOfCurrentOdai(
    params: KotaeOfCurrentOdaiParams,
    odaiDocId: string
  ): Promise<KotaeResponse[]> {
    throw new Error('Method not implemented.')
  }
  getPersonalResult(
    params: KotaePersonalResultParams,
    odaiDocId: string
  ): Promise<KotaeResponse[]> {
    throw new Error('Method not implemented.')
  }
  getVotedBy(params: KotaeVotedByParams): Promise<KotaeVotedBy[]> {
    throw new Error('Method not implemented.')
  }
  getByContent(
    params: KotaeByContentParams & { odaiDocId: string }
  ): Promise<KotaeByContentResponse | null> {
    throw new Error('Method not implemented.')
  }
  incrementVoteCount(
    params: Pick<KotaeIncrementVoteCountParams, 'slackTeamId' | 'rank'> & {
      odaiDocId: string
      kotaeDocId: string
    }
  ): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
}
