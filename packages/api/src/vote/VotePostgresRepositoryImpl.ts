import {
  VoteCreateRequest,
  Vote,
  VoteOfCurrentOdaiParams,
  VoteCountByUserParams,
  VoteCheckDuplicationParams,
  VoteOfCurrentOdaiResponse,
} from './Vote'
import { VoteRepository } from './VoteRepository'
import { prismaClient } from '../prisma/client'

export class VotePostgresRepositoryImpl implements VoteRepository {
  checkDuplication(
    _params: VoteCheckDuplicationParams
  ): Promise<'ok' | 'alreadyVoted' | 'alreadySameRankVoted'> {
    throw new Error('Method not implemented.')
  }
  async create({
    id,
    content,
    votedBy,
    rank,
    odaiId,
    kotaeId,
    kotaeCreatedBy,
  }: VoteCreateRequest & {
    odaiId: string
    kotaeId: string
    kotaeCreatedBy: string
  }): Promise<Vote> {
    const createdAt = new Date()
    // TODO: エラーハンドリング
    await prismaClient.vote.create({
      data: {
        id,
        odaiId,
        createdBy: votedBy,
        rank,
        createdAt,
        kotaeId,
      },
    })
    return {
      votedBy,
      rank,
      kotaeId,
      kotaeCreatedBy,
      createdAt,
      kotaeContent: content,
    }
  }
  async getAllOfCurrentOdai(
    _params: VoteOfCurrentOdaiParams,
    odaiId: string
  ): Promise<VoteOfCurrentOdaiResponse> {
    const votes = await prismaClient.vote.findMany({
      where: {
        odaiId,
      },
    })

    return votes.map((vote) => ({
      votedBy: vote.createdBy,
      rank: vote.rank as Vote['rank'],
      kotaeId: vote.kotaeId,
      kotaeCreatedBy: vote.createdBy,
      createdAt: vote.createdAt,
    }))
  }
  getAllByUser(_params: VoteCountByUserParams): Promise<Vote[]> {
    throw new Error('Method not implemented.')
  }
}
