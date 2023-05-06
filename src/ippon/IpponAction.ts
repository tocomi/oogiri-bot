import { WebClient } from '@slack/web-api'
import { postMessage } from '../message/postMessage'
import { createIpponBlocks } from './blocks/createIpponBlocks'
import { createWinBlocks } from './blocks/createWinBlocks'

export const createIppon = ({
  client,
  userId,
  kotaeContent,
}: {
  client: WebClient
  userId: string
  kotaeContent: string
}) => {
  const blocks = createIpponBlocks({ userId, kotaeContent })

  return postMessage({
    client,
    blocks,
  })
}

export const createWin = ({
  client,
  ipponCountList,
  userInfoMap,
}: {
  client: WebClient
  ipponCountList: Parameters<typeof createWinBlocks>[0]['ipponCountList']
  userInfoMap: Parameters<typeof createWinBlocks>[0]['userInfoMap']
}) => {
  const blocks = createWinBlocks({ ipponCountList, userInfoMap })

  return postMessage({
    client,
    blocks,
  })
}
