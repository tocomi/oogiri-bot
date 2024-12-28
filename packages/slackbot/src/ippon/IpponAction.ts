import { WebClient } from '@slack/web-api'
import { postMessage } from '../slack/postMessage'
import { createIpponBlocks } from './blocks/createIpponBlocks'
import { createWinContentBlocks } from './blocks/createWinContentBlocks'
import { createWinFooterBlocks } from './blocks/createWinFooterBlocks'
import { createWinHeaderBlocks } from './blocks/createWinHeaderBlocks'

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
  odaiTitle,
  odaiImageUrl,
  kotaeCounts,
  voteCounts,
  ipponCountList,
  userInfoMap,
}: {
  client: WebClient
  odaiTitle: Parameters<typeof createWinHeaderBlocks>[0]['odaiTitle']
  odaiImageUrl?: Parameters<typeof createWinHeaderBlocks>[0]['odaiImageUrl']
  kotaeCounts: Parameters<typeof createWinHeaderBlocks>[0]['kotaeCounts']
  voteCounts: Parameters<typeof createWinHeaderBlocks>[0]['voteCounts']
  ipponCountList: Parameters<typeof createWinContentBlocks>[0]['ipponCountList']
  userInfoMap: Parameters<typeof createWinContentBlocks>[0]['userInfoMap']
}) => {
  const blocks = [
    ...createWinHeaderBlocks({ odaiTitle, odaiImageUrl, kotaeCounts, voteCounts }),
    ...createWinContentBlocks({ ipponCountList, userInfoMap }),
    ...createWinFooterBlocks(),
  ]

  return postMessage({
    client,
    blocks,
  })
}
