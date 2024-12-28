import {
  VoteCreateRequest,
  Vote,
  VoteOfCurrentOdaiParams,
  VoteCountByUserParams,
  VoteCheckDuplicationParams,
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
  getAllOfCurrentOdai(_params: VoteOfCurrentOdaiParams, _odaiDocId: string): Promise<Vote[]> {
    throw new Error('Method not implemented.')
  }
  getAllByUser(_params: VoteCountByUserParams): Promise<Vote[]> {
    throw new Error('Method not implemented.')
  }
}
