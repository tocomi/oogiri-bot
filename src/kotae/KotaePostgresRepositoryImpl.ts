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
    odaiId: string,
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
  async getAllOfCurrentOdai(
    _params: KotaeOfCurrentOdaiParams,
    odaiId: string,
  ): Promise<Kotae[]> {
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
  async getPersonalResult(
    { userId }: KotaePersonalResultParams,
    odaiId: string,
  ): Promise<Kotae[]> {
    const kotaes = await prismaClient.kotae.findMany({
      include: {
        votes: true,
      },
      where: {
        odaiId,
        createdBy: userId,
      },
    })
    return kotaes.map((kotae) => ({
      id: kotae.id,
      content: kotae.content,
      createdBy: kotae.createdBy,
      votedCount: kotae.votes.length,
      votedFirstCount: kotae.votes.filter((v) => v.rank === 1).length,
      votedSecondCount: kotae.votes.filter((v) => v.rank === 2).length,
      votedThirdCount: kotae.votes.filter((v) => v.rank === 3).length,
      createdAt: kotae.createdAt.getTime(),
    }))
  }
  async getVotedBy({
    kotaeDocId,
  }: KotaeVotedByParams): Promise<KotaeVotedBy[]> {
    const votes = await prismaClient.vote.findMany({
      where: {
        kotaeId: kotaeDocId,
      },
    })
    return votes.map((vote) => ({
      votedBy: vote.createdBy,
      rank: vote.rank as KotaeVotedBy['rank'],
      createdAt: vote.createdAt.getTime(),
    }))
  }
  getByContent(
    _params: KotaeByContentParams & { odaiDocId: string },
  ): Promise<KotaeByContentResponse | null> {
    throw new Error('Method not implemented.')
  }
  incrementVoteCount(
    _params: Pick<KotaeIncrementVoteCountParams, 'slackTeamId' | 'rank'> & {
      odaiDocId: string
      kotaeDocId: string
    },
  ): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
}
