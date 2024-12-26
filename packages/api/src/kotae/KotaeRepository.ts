import {
  KotaeByContentParams,
  KotaeByContentResponse,
  KotaeIncrementVoteCountParams,
  KotaeOfCurrentOdaiParams,
  KotaePersonalResultParams,
  KotaePostRequestParams,
  Kotae,
  KotaeVotedByParams,
  KotaeVotedBy,
} from './Kotae'

export interface KotaeRepository {
  create(params: KotaePostRequestParams, odaiId: string): Promise<boolean>
  getAllOfCurrentOdai(params: KotaeOfCurrentOdaiParams, odaiDocId: string): Promise<Kotae[]>
  getPersonalResult(params: KotaePersonalResultParams, odaiDocId: string): Promise<Kotae[]>
  getVotedBy(params: KotaeVotedByParams): Promise<KotaeVotedBy[]>
  getByContent(
    params: KotaeByContentParams & { odaiDocId: string }
  ): Promise<KotaeByContentResponse | null>
  incrementVoteCount(
    params: Pick<KotaeIncrementVoteCountParams, 'slackTeamId' | 'rank'> & {
      odaiDocId: string
      kotaeDocId: string
    }
  ): Promise<boolean>
}
