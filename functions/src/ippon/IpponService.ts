import { IpponCreateRequest, IpponCreateResponse } from './Ippon'
import { IpponRepository } from './IpponRepository'

export interface IpponService {
  create(params: IpponCreateRequest): Promise<IpponCreateResponse>
}

export class IpponServiceImpl implements IpponService {
  repository: IpponRepository

  constructor(private ipponRepository: IpponRepository) {
    this.repository = ipponRepository
  }

  async create(params: IpponCreateRequest): Promise<IpponCreateResponse> {
    const ippon = await this.ipponRepository.create(params)

    const ipponCountOfUser = await this.ipponRepository.getIpponCountByUser({
      slackTeamId: params.slackTeamId,
      odaiId: params.odaiId,
      userId: params.userId,
    })

    // NOTE: ippon 数が基準を満たしたら試合終了
    if (params.winIpponCount === ipponCountOfUser) {
      return {
        ippon,
        win: { userId: params.userId, odaiId: params.odaiId, odaiTitle: params.odaiTitle },
      }
    }

    // NOTE: 試合続行の場合は ippon のみ返す
    return { ippon }
  }
}
