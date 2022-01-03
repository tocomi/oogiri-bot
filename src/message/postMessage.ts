import { KnownBlock } from '@slack/types'
import { WebClient } from '@slack/web-api'
import { config } from '../config'

const CHANNEL_ID = config.slack.channelId

export const postMessage = async ({
  client,
  blocks,
}: {
  client: WebClient
  blocks: KnownBlock[]
}) => {
  await client.chat.postMessage({
    channel: CHANNEL_ID,
    blocks,
  })
}

export const postEphemeral = async ({
  client,
  user,
  blocks,
}: {
  client: WebClient
  user: string
  blocks: KnownBlock[]
}) => {
  await client.chat.postEphemeral({
    channel: CHANNEL_ID,
    user,
    blocks,
  })
}

const createErrorMessageBlocks = (overrideMessage?: string): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'おや、何かがおかしいようです:thinking_face:',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: overrideMessage ? overrideMessage : '時間をおいて再度お試しください:pray:',
    },
  },
]

export const postInternalErrorMessage = async ({
  client,
  user,
  overrideMessage,
}: {
  client: WebClient
  user: string
  overrideMessage?: string
}) => {
  await postEphemeral({
    client,
    user,
    blocks: createErrorMessageBlocks(overrideMessage),
  })
}
