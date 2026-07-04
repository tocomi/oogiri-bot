import { ApiError, hasError, InternalServerError } from '../api/Error'
import { KotaeRepository } from '../kotae/KotaeRepository'
import { OdaiResponseBase } from '../odai/Odai'
import { OdaiRepository } from '../odai/OdaiRepository'
import { VoteRepository } from '../vote/VoteRepository'
import {
  AdminActiveOdaiOverview,
  AdminActiveOdaiParams,
} from './AdminActiveOdai'

type CurrentOdaiRepository = Pick<OdaiRepository, 'getCurrent'>
type CountableKotaeRepository = Pick<KotaeRepository, 'countByOdaiId'>
type CountableVoteRepository = Pick<VoteRepository, 'countByOdaiId'>

/**
 * getCurrent の戻り値から管理画面に表示できる進行中お題か判定する
 */
const isActiveOdai = (
  odai: OdaiResponseBase,
): odai is OdaiResponseBase & { status: 'posting' | 'voting' } => {
  return odai.status === 'posting' || odai.status === 'voting'
}

export interface AdminActiveOdaiService {
  /**
   * 管理画面に表示するアクティブお題の概要を取得する
   * 進行中のお題の有無と、あれば内容・締切・回答数・投票数をまとめて返すために使う
   */
  get(
    params: AdminActiveOdaiParams,
  ): Promise<AdminActiveOdaiOverview | ApiError>
}

export class AdminActiveOdaiServiceImpl implements AdminActiveOdaiService {
  private odaiRepository: CurrentOdaiRepository
  private kotaeRepository: CountableKotaeRepository
  private voteRepository: CountableVoteRepository

  constructor({
    odaiRepository,
    kotaeRepository,
    voteRepository,
  }: {
    odaiRepository: CurrentOdaiRepository
    kotaeRepository: CountableKotaeRepository
    voteRepository: CountableVoteRepository
  }) {
    this.odaiRepository = odaiRepository
    this.kotaeRepository = kotaeRepository
    this.voteRepository = voteRepository
  }

  /**
   * 管理画面に表示するアクティブお題の概要を取得する
   * repository の取得失敗を API 共通の InternalServerError に変換するために使う
   */
  async get({
    slackTeamId,
  }: AdminActiveOdaiParams): Promise<AdminActiveOdaiOverview | ApiError> {
    const currentOdai = await this.odaiRepository.getCurrent({ slackTeamId })
    if (!currentOdai || hasError(currentOdai) || !isActiveOdai(currentOdai)) {
      return { active: false }
    }

    const [kotaeCount, voteCount] = await Promise.all([
      this.kotaeRepository.countByOdaiId({ odaiId: currentOdai.id }),
      this.voteRepository.countByOdaiId({ odaiId: currentOdai.id }),
    ])

    if (kotaeCount === null || voteCount === null) {
      return InternalServerError
    }

    return {
      active: true,
      odai: {
        createdAt: currentOdai.createdAt,
        dueDate: currentOdai.dueDate,
        id: currentOdai.id,
        kotaeCount,
        status: currentOdai.status,
        title: currentOdai.title,
        voteCount,
      },
    }
  }
}
