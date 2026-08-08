import { ApiError, InternalServerError } from '../api/Error'
import { AdminOdaiList, AdminOdaiListParams } from './AdminOdaiList'
import { AdminReportingRepository } from './AdminReportingRepository'

type ListReportingRepository = Pick<AdminReportingRepository, 'getOdaiList'>

export interface AdminOdaiListService {
  /**
   * 管理画面の一覧とグラフに表示するお題を取得する
   */
  get(params: AdminOdaiListParams): Promise<AdminOdaiList | ApiError>
}

export class AdminOdaiListServiceImpl implements AdminOdaiListService {
  private reportingRepository: ListReportingRepository

  constructor({
    reportingRepository,
  }: {
    reportingRepository: ListReportingRepository
  }) {
    this.reportingRepository = reportingRepository
  }

  /**
   * 管理画面の一覧とグラフに表示するお題を取得する
   * repository の取得失敗を API 共通の InternalServerError に変換するために使う
   */
  async get(params: AdminOdaiListParams): Promise<AdminOdaiList | ApiError> {
    const items = await this.reportingRepository.getOdaiList(params)
    if (items.status !== 'ok') return InternalServerError

    return { items: items.value }
  }
}
