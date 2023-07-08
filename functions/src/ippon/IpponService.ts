import { hasError } from '../api/Error'
import { KotaeService } from '../kotae/KotaeService'
import { IpponCreateRequest, IpponCreateResponse, WinResult } from './Ippon'
import { IpponRepository } from './IpponRepository'

export interface IpponService {
  create(params: IpponCreateRequest): Promise<IpponCreateResponse>
}

export class IpponServiceImpl implements IpponService {
  repository: IpponRepository
  kotaeService: KotaeService

  constructor(private ipponRepository: IpponRepository, kotaeService: KotaeService) {
    this.repository = ipponRepository
    this.kotaeService = kotaeService
  }

  async create(params: IpponCreateRequest): Promise<IpponCreateResponse> {
    const ippon = await this.ipponRepository.create(params)

    const ipponCountOfUser = await this.ipponRepository.getIpponCountByUser({
      slackTeamId: params.slackTeamId,
      odaiId: params.odaiId,
      userId: params.userId,
    })

    // NOTE: 試合続行の場合は ippon のみ返す
    if (params.winIpponCount !== ipponCountOfUser) return { ippon }

    // NOTE: ippon 数が基準を満たしたら試合終了処理
    const [kotaeCounts, ipponList] = await Promise.all([
      this.kotaeService.getCurrentCounts({ slackTeamId: params.slackTeamId }),
      this.ipponRepository.getAllIpponOfOdai({
        slackTeamId: params.slackTeamId,
        odaiId: params.odaiId,
      }),
    ])
    if (hasError(kotaeCounts)) return kotaeCounts

    // NOTE: IPPON のデータからユーザーごとの IPPON 数を集計
    const ipponResult: WinResult['ipponResult'] = []
    for (const ippon of ipponList) {
      const userIpponCount = ipponResult.find((result) => result.userId === ippon.userId)
      if (userIpponCount) {
        userIpponCount.ipponCount += 1
        continue
      }

      ipponResult.push({
        userId: ippon.userId,
        ipponCount: 1,
      })
    }

    return {
      ippon,
      winResult: {
        odaiId: params.odaiId,
        odaiTitle: params.odaiTitle,
        odaiImageUrl: params.odaiImageUrl,
        kotaeCount: kotaeCounts.kotaeCount,
        kotaeUserCount: kotaeCounts.kotaeUserCount,
        voteCount: params.voteCounts.voteCount,
        voteUserCount: params.voteCounts.uniqueUserCount,
        ipponResult,
      },
    }
  }
}