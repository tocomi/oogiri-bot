import { KnownBlock } from '@slack/types'
import { Logger, WebClient } from '@slack/web-api'

import { getCharacterMessage } from '../../message'
import { postEphemeral } from '../postMessage'

type ProcessingMessageParams = {
  client: WebClient
  user: string
  logger: Logger
}

const postProcessingMessage = async ({
  client,
  user,
  logger,
  blocks,
}: ProcessingMessageParams & {
  blocks: KnownBlock[]
}) => {
  try {
    await postEphemeral({ client, user, blocks })
  } catch (error) {
    logger.warn(error)
  }
}

const createTextBlocks = (text: string): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:hourglass_flowing_sand: *処理中*\n${text}`,
    },
  },
]

export const postRequestAcceptedMessage = async (
  params: ProcessingMessageParams,
) => {
  await postProcessingMessage({
    ...params,
    blocks: createTextBlocks(getCharacterMessage('request-accepted')),
  })
}

export const postCommentaryProcessingMessage = async (
  params: ProcessingMessageParams,
) => {
  await postProcessingMessage({
    ...params,
    blocks: createTextBlocks(getCharacterMessage('commentary-processing')),
  })
}
