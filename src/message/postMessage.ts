import { KnownBlock, WebClient } from '@slack/web-api'

export const postMessage = async (client: WebClient, blocks: KnownBlock[]) => {
  await client.chat.postMessage({
    channel: 'C026ZJX56AC',
    blocks,
  })
}

export const postEphemeral = async (client: WebClient, user: string, text: string) => {
  await client.chat.postEphemeral({
    channel: 'C026ZJX56AC',
    user,
    text,
  })
}

export const postInternalErrorMessage = async (client: WebClient, user: string) => {
  await postEphemeral(
    client,
    user,
    'おや、何かがおかしいようです:thinking_face:  時間をおいて再度お試しください:pray:'
  )
}
