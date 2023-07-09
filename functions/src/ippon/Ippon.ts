import { SlackParams } from '../api/Api'
import { ApiError } from '../api/Error'

export type Ippon = {
  userId: string
  kotaeId: string
  kotaeContent: string
  odaiId: string
  odaiTitle: string
  createdAt: Date
}

export type WinResult = {
  odaiId: string
  odaiTitle: string
  odaiImageUrl?: string
  kotaeCount: number
  kotaeUserCount: number
  voteCount: number
  voteUserCount: number
  ipponResult: {
    userId: string
    ipponCount: number
  }[]
}

export type IpponCreateRequest = SlackParams &
  Omit<Ippon, 'createdAt'> & {
    winIpponCount: number
    odaiImageUrl?: string
    voteCounts: { voteCount: number; uniqueUserCount: number }
  }
export type IpponCreateResponse =
  | {
      ippon: Ippon
      winResult?: WinResult
    }
  | ApiError

export type IpponGetByUserRequest = SlackParams & { odaiId: string; userId: string }

export type IpponGetAllRequest = SlackParams & { odaiId: string }
export type IpponGetAllResponse = Ippon[]
