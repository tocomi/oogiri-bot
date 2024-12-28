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
  getAllOfCurrentOdai(_params: KotaeOfCurrentOdaiParams, _odaiDocId: string): Promise<Kotae[]> {
    throw new Error('Method not implemented.')
  }
  getPersonalResult(_params: KotaePersonalResultParams, _odaiDocId: string): Promise<Kotae[]> {
    throw new Error('Method not implemented.')
  }
  getVotedBy(_params: KotaeVotedByParams): Promise<KotaeVotedBy[]> {
    throw new Error('Method not implemented.')
  }
  getByContent(
    _params: KotaeByContentParams & { odaiDocId: string }
  ): Promise<KotaeByContentResponse | null> {
    throw new Error('Method not implemented.')
  }
  incrementVoteCount(
    _params: Pick<KotaeIncrementVoteCountParams, 'slackTeamId' | 'rank'> & {
      odaiDocId: string
      kotaeDocId: string
    }
  ): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
}
