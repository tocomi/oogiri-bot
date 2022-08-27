import { UsersInfoResponse, WebClient } from '@slack/web-api'

export const getSlackUserList = async ({
  client,
  userIdList,
}: {
  client: WebClient
  userIdList: string[]
}) => {
  const userIdSet = [...new Set(userIdList)]
  const userInfoMap: { [userId: string]: UsersInfoResponse['user'] } = {}
  for (const userId of userIdSet) {
    const userInfo = await client.users.info({ user: userId })
    userInfoMap[userId] = userInfo.user
  }
  return userInfoMap
}
