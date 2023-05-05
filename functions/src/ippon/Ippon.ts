import { SlackParams } from '../api/Api'

export type Ippon = {
  userId: string
  kotaeId: string
  kotaeContent: string
  odaiId: string
  odaiTitle: string
  createdAt: Date
}

export type Win = {
  userId: string
  odaiId: string
  odaiTitle: string
}

export type IpponCreateRequest = SlackParams & Omit<Ippon, 'createdAt'> & { winIpponCount: number }
export type IpponCreateResponse = {
  ippon: Ippon
  win?: Win
}

export type IpponGetByUserRequest = SlackParams & { odaiId: string; userId: string }
