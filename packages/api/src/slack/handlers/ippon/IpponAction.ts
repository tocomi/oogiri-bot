import { WebClient } from '@slack/web-api'
import { createIpponBlocks } from '../../../ippon/blocks/createIpponBlocks'
import { createWinContentBlocks } from '../../../ippon/blocks/createWinContentBlocks'
import { createWinFooterBlocks } from '../../../ippon/blocks/createWinFooterBlocks'
import { createWinHeaderBlocks } from '../../../ippon/blocks/createWinHeaderBlocks'
import { postMessage } from '../../postMessage'

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
    ...createWinHeaderBlocks({
      odaiTitle,
      odaiImageUrl,
      kotaeCounts,
      voteCounts,
    }),
    ...createWinContentBlocks({ ipponCountList, userInfoMap }),
    ...createWinFooterBlocks(),
  ]

  return postMessage({
    client,
    blocks,
  })
}
