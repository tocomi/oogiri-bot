import { ApiPostStatus } from '../api/Api'
import {
  AlreadySameRankVotedError,
  AlreadyVotedError,
  hasError,
  InternalServerError,
  NoVotingOdaiError,
} from '../api/Error'
import { KotaeService } from '../kotae/KotaeService'
import { OdaiService } from '../odai/OdaiService'
import {
  VoteRequestParams,
  VoteCountResponse,
  VoteCountParams,
  VoteByUserParams,
  VoteByUserResponse,
  Vote,
} from './Vote'
import { VoteRepository } from './VoteRepository'

export interface VoteService {
  create(params: VoteRequestParams): Promise<ApiPostStatus>
  getVoteCount(params: VoteCountParams): Promise<VoteCountResponse>
  getTotalVoteCountByUser(params: VoteByUserParams): Promise<VoteByUserResponse>
}

export class VoteServiceImpl implements VoteService {
  repository: VoteRepository
  odaiService: OdaiService
  kotaeService: KotaeService

  constructor(repository: VoteRepository, odaiService: OdaiService, kotaeService: KotaeService) {
    this.repository = repository
    this.odaiService = odaiService
    this.kotaeService = kotaeService
  }

  async create({ slackTeamId, content, votedBy, rank }: VoteRequestParams): Promise<ApiPostStatus> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId })
    if (hasError(currentOdai)) return currentOdai
    if (currentOdai.status !== 'voting') return NoVotingOdaiError

    const kotae = await this.kotaeService.getByContent({ slackTeamId, content })
    if (hasError(kotae)) return kotae

    const voteResult = await this.repository.create({
      slackTeamId,
      content,
      votedBy,
      rank,
      odaiDocId: currentOdai.docId,
      kotaeDocId: kotae.docId,
      kotaeCreatedBy: kotae.createdBy,
    })
    if (!voteResult) return InternalServerError
    if (voteResult === 'alreadyVoted') return AlreadyVotedError
    if (voteResult === 'alreadySameRankVoted') return AlreadySameRankVotedError

    const result = await this.kotaeService.incrementVoteCount({
      slackTeamId,
      content,
      rank,
    })

    return result
  }

  async getVoteCount(params: VoteCountParams): Promise<VoteCountResponse> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId: params.slackTeamId })
    if (hasError(currentOdai)) return currentOdai
    if (currentOdai.status !== 'voting') return NoVotingOdaiError
    const votes = await this.repository.getAllOfCurrentOdai(params, currentOdai.docId)
    return {
      odaiTitle: currentOdai.title,
      odaiImageUrl: currentOdai.imageUrl,
      odaiStatus: currentOdai.status,
      uniqueUserCount: [...new Set(votes.map((v) => v.votedBy))].length,
      voteCount: votes.length,
    }
  }

  async getTotalVoteCountByUser(params: VoteByUserParams): Promise<VoteByUserResponse> {
    const votes = await this.repository.getAllByUser(params)
    const uniqueVotes = this.removeDuplication(votes)
    let result: VoteByUserResponse = []
    uniqueVotes.forEach((vote) => {
      const target = result.find((v) => v.votedBy === vote.votedBy)
      if (!target) {
        result.push({
          votedBy: vote.votedBy,
          voteCount: 1,
        })
        return
      }
      result = result.filter((v) => v.votedBy !== vote.votedBy)
      result.push({
        votedBy: target.votedBy,
        voteCount: target.voteCount + 1,
      })
    })
    return result
  }

  /**
   * 2 つの vote コレクションからドキュメントを取得することによって発生する重複を取り除く。
   * @param {Vote[]} votes
   * @return {Vote[]} unique votes
   */
  private removeDuplication(votes: Vote[]): Vote[] {
    const newVotes: Vote[] = []
    votes.forEach((vote) => {
      if (newVotes.every((newVote) => newVote.createdAt !== vote.createdAt)) {
        newVotes.push(vote)
      }
    })
    return newVotes
  }
}
