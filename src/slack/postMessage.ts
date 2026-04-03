import { KnownBlock } from '@slack/types'
import { WebClient } from '@slack/web-api'
import { config } from '../config'

const CHANNEL_ID = config.slack.channelId

const collectFallbackTexts = (blocks: KnownBlock[]): string[] => {
  return blocks.flatMap((block) => {
    switch (block.type) {
      case 'section':
      case 'header':
        return 'text' in block && block.text ? [block.text.text] : []
      case 'context':
        return block.elements.flatMap((element) =>
          element.type === 'plain_text' || element.type === 'mrkdwn'
            ? [element.text]
            : [],
        )
      case 'image':
        return block.alt_text ? [block.alt_text] : []
      default:
        return []
    }
  })
}

const createFallbackText = (blocks: KnownBlock[]): string => {
  const text = collectFallbackTexts(blocks)
    .map((value) => value.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' / ')

  return text || 'Slack message'
}

export const postMessage = async ({
  client,
  blocks,
  options = {},
}: {
  client: WebClient
  blocks: KnownBlock[]
  options?: Partial<NonNullable<Parameters<typeof client.chat.postMessage>[0]>>
}) => {
  await client.chat.postMessage({
    ...options,
    channel: CHANNEL_ID,
    text: options.text ?? createFallbackText(blocks),
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
    text: createFallbackText(blocks),
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
      text: overrideMessage
        ? overrideMessage
        : '時間をおいて再度お試しください:pray:',
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
