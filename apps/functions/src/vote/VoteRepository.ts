import { SlackParams } from '../api/Api'
import {
  Vote,
  VoteCountByUserParams,
  VoteOfCurrentOdaiParams,
  VoteCreateRequest,
  VoteCheckDuplicationParams,
  VoteOfCurrentOdaiResponse,
} from './Vote'

export interface VoteRepository {
  checkDuplication(
    params: VoteCheckDuplicationParams,
  ): Promise<'ok' | 'alreadyVoted' | 'alreadySameRankVoted'>
  /**
   * 投稿されている投票の総数を取得する
   */
  countAll(params: SlackParams): Promise<number | null>
  /**
   * 指定お題に紐づく投票の件数を取得する
   */
  countByOdaiId(params: { odaiId: string }): Promise<number | null>
  create(
    params: VoteCreateRequest & {
      odaiId: string
      kotaeId: string
      kotaeCreatedBy: string
    },
  ): Promise<Vote>
  getAllOfCurrentOdai(
    params: VoteOfCurrentOdaiParams,
    odaiId: string,
  ): Promise<VoteOfCurrentOdaiResponse>
  getAllByUser(params: VoteCountByUserParams): Promise<Vote[]>
}
