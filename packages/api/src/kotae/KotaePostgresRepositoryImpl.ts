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
  async getAllOfCurrentOdai(_params: KotaeOfCurrentOdaiParams, odaiId: string): Promise<Kotae[]> {
    const kotaes = await prismaClient.kotae.findMany({
      include: {
        votes: true,
      },
      where: {
        odaiId,
      },
    })

    const formattedKotaes = kotaes.map((kotae) => ({
      id: kotae.id,
      content: kotae.content,
      createdBy: kotae.createdBy,
      votedCount: kotae.votes.length,
      votedFirstCount: kotae.votes.filter((v) => v.rank === 1).length,
      votedSecondCount: kotae.votes.filter((v) => v.rank === 2).length,
      votedThirdCount: kotae.votes.filter((v) => v.rank === 3).length,
      createdAt: kotae.createdAt.getTime(),
    }))

    return formattedKotaes
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
