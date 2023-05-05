import { WebClient } from '@slack/web-api'
import { postMessage } from '../message/postMessage'
import { createIpponBlocks } from './blocks/createIpponBlocks'

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
