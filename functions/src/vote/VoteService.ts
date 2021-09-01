import { KotaeService } from '../kotae/KotaeService'
import { OdaiService } from '../odai/OdaiService'
import { VoteRequestParams, VoteApiStatus, VoteCountResponse, VoteCountParams } from './Vote'
import { VoteRepository } from './VoteRepository'

export interface VoteService {
  create(params: VoteRequestParams): Promise<VoteApiStatus>
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

  async create({ slackTeamId, content, votedBy }: VoteRequestParams): Promise<VoteApiStatus> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId })
    if (!currentOdai) return 'noOdai'
    if (currentOdai.status !== 'voting') return 'noVotingOdai'

    const kotae = await this.kotaeService.getByContent({ slackTeamId, content })
    if (kotae === 'noOdai') return 'noOdai'
    if (kotae === 'noKotae') return 'noKotae'

    const voteResult = await this.repository.create({
      slackTeamId,
      content,
      votedBy,
      odaiDocId: currentOdai.docId,
      kotaeDocId: kotae.docId,
    })
    if (voteResult === 'noVotingOdai') return 'noVotingOdai'
    if (voteResult === 'alreadyVoted') return 'alreadyVoted'

    await this.kotaeService.incrementVoteCount({
      slackTeamId,
      content,
    })

    return 'ok'
  }

  async getVoteCount(params: VoteCountParams): Promise<VoteCountResponse> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId: params.slackTeamId })
    if (!currentOdai) return 'noOdai'
    if (currentOdai.status !== 'voting') return 'noVotingOdai'
    const votes = await this.repository.getAllOfCurrentOdai(params, currentOdai.docId)
    return {
      odaiTitle: currentOdai.title,
      uniqueUserCount: [...new Set(votes.map((v) => v.votedBy))].length,
      voteCount: votes.length,
    }
  }
}
