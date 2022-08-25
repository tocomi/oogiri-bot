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
  VoteCountByUserParams,
  VoteCountByUserResponse,
  Vote,
  VoteCountByUser,
} from './Vote'
import { VoteRepository } from './VoteRepository'

export interface VoteService {
  create(params: VoteRequestParams): Promise<ApiPostStatus>
  getVoteCount(params: VoteCountParams): Promise<VoteCountResponse>
  getTotalVoteCountByUser(params: VoteCountByUserParams): Promise<VoteCountByUserResponse>
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

  async getTotalVoteCountByUser(params: VoteCountByUserParams): Promise<VoteCountByUserResponse> {
    const votes = await this.repository.getAllByUser(params)
    const uniqueVotes = this.removeDuplication(votes)

    // NOTE: 全期間
    let allVotes: VoteCountByUser[] = []
    uniqueVotes.forEach((vote) => {
      const target = allVotes.find((v) => v.votedBy === vote.votedBy)
      if (!target) {
        allVotes.push({
          votedBy: vote.votedBy,
          voteCount: 1,
        })
        return
      }
      allVotes = allVotes.filter((v) => v.votedBy !== vote.votedBy)
      allVotes.push({
        votedBy: target.votedBy,
        voteCount: target.voteCount + 1,
      })
    })

    // NOTE: 直近 5 戦
    const recent5timesOdai = await this.odaiService.getRecent5timesFinished({
      slackTeamId: params.slackTeamId,
    })
    if (hasError(recent5timesOdai)) return recent5timesOdai

    console.log(recent5timesOdai)
    const borderCreatedAt = recent5timesOdai.slice(-1)[0].createdAt
    console.log('borderCreatedAt: ', borderCreatedAt)

    let recent5timesVotes: VoteCountByUser[] = []
    uniqueVotes
      .filter((vote) => vote.createdAt > borderCreatedAt)
      .forEach((vote) => {
        console.log('voteCreatedAt: ', vote.createdAt)
        const target = recent5timesVotes.find((v) => v.votedBy === vote.votedBy)
        if (!target) {
          recent5timesVotes.push({
            votedBy: vote.votedBy,
            voteCount: 1,
          })
          return
        }
        recent5timesVotes = recent5timesVotes.filter((v) => v.votedBy !== vote.votedBy)
        recent5timesVotes.push({
          votedBy: target.votedBy,
          voteCount: target.voteCount + 1,
        })
      })

    return {
      allCount: allVotes.sort((a, b) => b.voteCount - a.voteCount),
      recent5timesCount: recent5timesVotes.sort((a, b) => b.voteCount - a.voteCount),
    }
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
