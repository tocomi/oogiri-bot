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
