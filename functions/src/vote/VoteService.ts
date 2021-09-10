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
import { VoteRequestParams, VoteCountResponse, VoteCountParams } from './Vote'
import { VoteRepository } from './VoteRepository'

export interface VoteService {
  create(params: VoteRequestParams): Promise<ApiPostStatus>
  getVoteCount(params: VoteCountParams): Promise<VoteCountResponse>
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
      uniqueUserCount: [...new Set(votes.map((v) => v.votedBy))].length,
      voteCount: votes.length,
    }
  }
}
