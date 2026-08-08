import { ApiError, InternalServerError } from '../api/Error'
import {
  AdminAvailableYears,
  AdminAvailableYearsParams,
} from './AdminAvailableYears'
import { AdminReportingRepository } from './AdminReportingRepository'

type AvailableYearsReportingRepository = Pick<
  AdminReportingRepository,
  'getAvailableYears'
>

export interface AdminAvailableYearsService {
  /**
   * 管理画面の期間選択に並べる年を取得する
   */
  get(
    params: AdminAvailableYearsParams,
  ): Promise<AdminAvailableYears | ApiError>
}

export class AdminAvailableYearsServiceImpl implements AdminAvailableYearsService {
  private reportingRepository: AvailableYearsReportingRepository

  constructor({
    reportingRepository,
  }: {
    reportingRepository: AvailableYearsReportingRepository
  }) {
    this.reportingRepository = reportingRepository
  }

  /**
   * 管理画面の期間選択に並べる年を取得する
   * repository の取得失敗を API 共通の InternalServerError に変換するために使う
   */
  async get(
    params: AdminAvailableYearsParams,
  ): Promise<AdminAvailableYears | ApiError> {
    const years = await this.reportingRepository.getAvailableYears(params)
    if (years.status !== 'ok') return InternalServerError

    return { years: years.value }
  }
}
