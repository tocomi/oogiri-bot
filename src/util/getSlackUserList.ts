import { UsersInfoResponse, WebClient } from '@slack/web-api'

/**
 * slack の userId から表示名などの情報を取得する
 */
export const getSlackUserList = async ({
  client,
  userIdList,
}: {
  client: WebClient
  userIdList: string[]
}) => {
  const userIdSet = [...new Set(userIdList)]
  const results = await Promise.all(
    userIdSet.map((userId) => client.users.info({ user: userId })),
  )
  const userInfoMap: { [userId: string]: UsersInfoResponse['user'] } = {}
  results.forEach((userInfo, i) => {
    userInfoMap[userIdSet[i]] = userInfo.user
  })
  return userInfoMap
}
