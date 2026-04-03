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
import { getSupabaseClient } from '../supabase/client'

export class KotaePostgresRepositoryImpl implements KotaeRepository {
  async create(
    { content, createdBy, id }: KotaePostRequestParams,
    odaiId: string,
  ): Promise<boolean> {
    const { error } = await getSupabaseClient().from('Kotae').insert({
      id,
      odaiId,
      content,
      createdBy,
      createdAt: new Date().toISOString(),
    })
    if (error) {
      console.error(error)
      return false
    }
    return true
  }

  async getAllOfCurrentOdai(
    _params: KotaeOfCurrentOdaiParams,
    odaiId: string,
  ): Promise<Kotae[]> {
    const { data: kotaes, error: kotaeError } = await getSupabaseClient()
      .from('Kotae')
      .select('*')
      .eq('odaiId', odaiId)

    if (kotaeError) {
      console.error(kotaeError)
      return []
    }

    const { data: votes, error: voteError } = await getSupabaseClient()
      .from('Vote')
      .select('kotaeId, rank')
      .eq('odaiId', odaiId)

    if (voteError) {
      console.error(voteError)
      return []
    }

    return kotaes.map((kotae) => {
      const kotaeVotes = votes.filter((v) => v.kotaeId === kotae.id)
      return {
        id: kotae.id,
        content: kotae.content,
        createdBy: kotae.createdBy,
        votedCount: kotaeVotes.length,
        votedFirstCount: kotaeVotes.filter((v) => v.rank === 1).length,
        votedSecondCount: kotaeVotes.filter((v) => v.rank === 2).length,
        votedThirdCount: kotaeVotes.filter((v) => v.rank === 3).length,
        createdAt: new Date(kotae.createdAt).getTime(),
      }
    })
  }

  async getPersonalResult(
    { userId }: KotaePersonalResultParams,
    odaiId: string,
  ): Promise<Kotae[]> {
    const { data: kotaes, error: kotaeError } = await getSupabaseClient()
      .from('Kotae')
      .select('*')
      .eq('odaiId', odaiId)
      .eq('createdBy', userId)

    if (kotaeError) {
      console.error(kotaeError)
      return []
    }

    const kotaeIds = kotaes.map((k) => k.id)
    if (kotaeIds.length === 0) return []

    const { data: votes, error: voteError } = await getSupabaseClient()
      .from('Vote')
      .select('kotaeId, rank')
      .in('kotaeId', kotaeIds)

    if (voteError) {
      console.error(voteError)
      return []
    }

    return kotaes.map((kotae) => {
      const kotaeVotes = votes.filter((v) => v.kotaeId === kotae.id)
      return {
        id: kotae.id,
        content: kotae.content,
        createdBy: kotae.createdBy,
        votedCount: kotaeVotes.length,
        votedFirstCount: kotaeVotes.filter((v) => v.rank === 1).length,
        votedSecondCount: kotaeVotes.filter((v) => v.rank === 2).length,
        votedThirdCount: kotaeVotes.filter((v) => v.rank === 3).length,
        createdAt: new Date(kotae.createdAt).getTime(),
      }
    })
  }

  async getVotedBy({
    kotaeDocId,
  }: KotaeVotedByParams): Promise<KotaeVotedBy[]> {
    const { data, error } = await getSupabaseClient()
      .from('Vote')
      .select('createdBy, rank, createdAt')
      .eq('kotaeId', kotaeDocId)

    if (error) {
      console.error(error)
      return []
    }

    return data.map((vote) => ({
      votedBy: vote.createdBy,
      rank: vote.rank as KotaeVotedBy['rank'],
      createdAt: new Date(vote.createdAt).getTime(),
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
