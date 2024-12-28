import { getSlackClient } from './client'

export const getUserNameMapFromUserId = async ({
  userIdList,
}: {
  userIdList: string[]
}): Promise<{ [userId: string]: string }> => {
  const client = getSlackClient()
  const userIdSet = [...new Set(userIdList)]
  const userNameMap: { [userId: string]: string } = {}
  for (const userId of userIdSet) {
    const userInfo = await client.users.info({ user: userId })
    // eslint-disable-next-line camelcase
    userNameMap[userId] = userInfo.user?.profile?.display_name || 'unknown'
  }
  return userNameMap
}
