import { ApiError, InternalServerError } from '../api/Error'
import { AdminReportingRepository } from './AdminReportingRepository'
import { AdminUserMatrix, AdminUserMatrixParams } from './AdminUserMatrix'

type UserMatrixReportingRepository = Pick<
  AdminReportingRepository,
  'getUserMatrixSource'
>

export interface AdminUserMatrixService {
  /**
   * ヒートマップに表示するお題 × ユーザーの集計を取得する
   */
  get(params: AdminUserMatrixParams): Promise<AdminUserMatrix | ApiError>
}

export class AdminUserMatrixServiceImpl implements AdminUserMatrixService {
  private reportingRepository: UserMatrixReportingRepository

  constructor({
    reportingRepository,
  }: {
    reportingRepository: UserMatrixReportingRepository
  }) {
    this.reportingRepository = reportingRepository
  }

  /**
   * ヒートマップに表示するお題 × ユーザーの集計を取得する
   * 行の並びと表示名は一覧と揃える必要があるため、ここでは決めず画面側に委ねる
   */
  async get(
    params: AdminUserMatrixParams,
  ): Promise<AdminUserMatrix | ApiError> {
    const matrix = await this.reportingRepository.getUserMatrixSource(params)
    if (matrix.status !== 'ok') return InternalServerError

    return matrix.value
  }
}
