import { SlackParams } from '../api/Api'
import {
  KotaeByContentQuery,
  KotaeIdentity,
  KotaeOfCurrentOdaiParams,
  KotaePersonalResultParams,
  KotaePostRequestParams,
  Kotae,
  KotaeVotedByParams,
  KotaeVotedBy,
} from './Kotae'

export interface KotaeRepository {
  create(params: KotaePostRequestParams, odaiId: string): Promise<boolean>
  /**
   * 投稿されている答えの総数を取得する
   */
  countAll(params: SlackParams): Promise<number | null>
  /**
   * 指定お題に紐づく答えの件数を取得する
   */
  countByOdaiId(params: { odaiId: string }): Promise<number | null>
  getAllOfCurrentOdai(
    params: KotaeOfCurrentOdaiParams,
    odaiDocId: string,
  ): Promise<Kotae[]>
  getPersonalResult(
    params: KotaePersonalResultParams,
    odaiDocId: string,
  ): Promise<Kotae[]>
  getVotedBy(params: KotaeVotedByParams): Promise<KotaeVotedBy[]>
  getByContent(params: KotaeByContentQuery): Promise<KotaeIdentity | null>
}
