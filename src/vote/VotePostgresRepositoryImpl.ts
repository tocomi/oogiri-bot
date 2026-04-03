import {
  VoteCreateRequest,
  Vote,
  VoteOfCurrentOdaiParams,
  VoteCountByUserParams,
  VoteCheckDuplicationParams,
  VoteOfCurrentOdaiResponse,
} from './Vote'
import { VoteRepository } from './VoteRepository'
import { getSupabaseClient } from '../supabase/client'

export class VotePostgresRepositoryImpl implements VoteRepository {
  checkDuplication(
    _params: VoteCheckDuplicationParams,
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
    const { error } = await getSupabaseClient().from('Vote').insert({
      id,
      odaiId,
      kotaeId,
      rank,
      createdBy: votedBy,
      createdAt: createdAt.toISOString(),
    })
    if (error) {
      console.error(error)
      throw error
    }
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
    odaiId: string,
  ): Promise<VoteOfCurrentOdaiResponse> {
    const { data, error } = await getSupabaseClient()
      .from('Vote')
      .select('*')
      .eq('odaiId', odaiId)

    if (error) {
      console.error(error)
      return []
    }

    return data.map((vote) => ({
      votedBy: vote.createdBy,
      rank: vote.rank as Vote['rank'],
      kotaeId: vote.kotaeId,
      kotaeCreatedBy: vote.createdBy,
      createdAt: new Date(vote.createdAt),
    }))
  }

  getAllByUser(_params: VoteCountByUserParams): Promise<Vote[]> {
    throw new Error('Method not implemented.')
  }
}
