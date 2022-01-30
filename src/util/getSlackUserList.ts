import { UsersInfoResponse, WebClient } from '@slack/web-api'
import { RankedKotae } from '../kotae/Kotae'

export const getSlackUserList = async ({
  client,
  rankedList,
}: {
  client: WebClient
  rankedList: RankedKotae[]
}) => {
  const userIdSet = [...new Set(rankedList.map((ranked) => ranked.createdBy))]
  const userInfoMap: { [userId: string]: UsersInfoResponse['user'] } = {}
  for (const userId of userIdSet) {
    const userInfo = await client.users.info({ user: userId })
    userInfoMap[userId] = userInfo.user
  }
  return userInfoMap
}
