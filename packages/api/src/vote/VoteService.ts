import {
  VoteCreateRequest,
  VoteCountResponse,
  VoteCountParams,
  VoteCountByUserParams,
  VoteCountByUserResponse,
  Vote,
  VoteCountByUser,
  VoteCreateResponse,
} from './Vote'
import { VoteRepository } from './VoteRepository'
import {
  AlreadySameRankVotedError,
  AlreadyVotedError,
  hasError,
  NoVotingOdaiError,
} from '../api/Error'
import { IpponService } from '../ippon/IpponService'
import { KotaeService } from '../kotae/KotaeService'
import { OdaiService } from '../odai/OdaiService'
import { generateId } from '../util/generateId'

export interface VoteService {
  create(params: VoteCreateRequest): Promise<VoteCreateResponse>
  getVoteCount(params: VoteCountParams): Promise<VoteCountResponse>
  getTotalVoteCountByUser(params: VoteCountByUserParams): Promise<VoteCountByUserResponse>
}

export class VoteServiceImpl implements VoteService {
  repository: VoteRepository
  newRepository: VoteRepository
  odaiService: OdaiService
  kotaeService: KotaeService
  ipponService: IpponService

  constructor(
    repository: VoteRepository,
    newRepository: VoteRepository,
    odaiService: OdaiService,
    kotaeService: KotaeService,
    ipponService: IpponService
  ) {
    this.repository = repository
    this.newRepository = newRepository
    this.odaiService = odaiService
    this.kotaeService = kotaeService
    this.ipponService = ipponService
  }

  async create({
    slackTeamId,
    content,
    votedBy,
    rank,
  }: VoteCreateRequest): Promise<VoteCreateResponse> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId })
    if (hasError(currentOdai)) return currentOdai

    // NOTE: IPPON グランプリモードでは voting のステータスはない
    if (currentOdai.type === 'normal' && currentOdai.status !== 'voting') return NoVotingOdaiError

    const kotae = await this.kotaeService.getByContent({ slackTeamId, content })
    if (hasError(kotae)) return kotae

    // NOTE: 投票の重複チェック
    const duplicationResult = await this.repository.checkDuplication({
      slackTeamId,
      votedBy,
      rank,
      odaiId: currentOdai.docId,
      kotaeId: kotae.id,
    })
    if (duplicationResult === 'alreadyVoted') return AlreadyVotedError
    if (duplicationResult === 'alreadySameRankVoted') return AlreadySameRankVotedError

    const id = generateId()
    const [voteResultA, _voteResultB] = await Promise.all([
      this.repository.create({
        id,
        slackTeamId,
        content,
        votedBy,
        rank,
        odaiId: currentOdai.docId,
        kotaeId: kotae.id,
        kotaeCreatedBy: kotae.createdBy,
      }),
      this.newRepository.create({
        id,
        slackTeamId,
        content,
        votedBy,
        rank,
        odaiId: currentOdai.docId,
        kotaeId: kotae.id,
        kotaeCreatedBy: kotae.createdBy,
      }),
    ])

    await this.kotaeService.incrementVoteCount({
      slackTeamId,
      content,
      rank,
    })

    // NOTE: 依存方向の関係で投票情報はここで取得して ipponService に渡す
    const voteCounts = await this.getVoteCount({ slackTeamId })
    if (hasError(voteCounts)) return voteCounts

    // NOTE: 投票数が IPPON の基準を満たした場合はその情報を一緒に返す
    if (currentOdai.type === 'ippon' && currentOdai.ipponVoteCount === kotae.votedCount + 1) {
      const ipponResult = await this.ipponService.create({
        slackTeamId,
        userId: kotae.createdBy,
        kotaeId: kotae.id,
        kotaeContent: kotae.content,
        odaiId: currentOdai.docId,
        odaiTitle: currentOdai.title,
        odaiImageUrl: currentOdai.imageUrl,
        winIpponCount: currentOdai.winIpponCount,
        voteCounts,
      })
      if (hasError(ipponResult)) return ipponResult
      return {
        vote: voteResultA,
        ippon: ipponResult.ippon,
        winResult: ipponResult.winResult,
      }
    }

    return { vote: voteResultA }
  }

  async getVoteCount(params: VoteCountParams): Promise<VoteCountResponse> {
    const currentOdai = await this.odaiService.getCurrent({ slackTeamId: params.slackTeamId })
    if (hasError(currentOdai)) return currentOdai

    // NOTE: IPPON グランプリモードでは voting のステータスはない
    if (currentOdai.type === 'normal' && currentOdai.status !== 'voting') return NoVotingOdaiError

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

    const borderCreatedAt = recent5timesOdai.slice(-1)[0].createdAt

    let recent5timesVotes: VoteCountByUser[] = []
    uniqueVotes
      .filter((vote) => (vote.createdAt as number) > borderCreatedAt)
      .forEach((vote) => {
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
