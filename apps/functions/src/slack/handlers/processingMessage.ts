import { KnownBlock } from '@slack/types'
import { Logger, WebClient } from '@slack/web-api'

import { getCharacterMessage } from '../../message'
import { convertVoteRankText } from '../../vote/convertVoteValue'
import { VoteCreateRequest } from '../../vote/Vote'
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
      text,
    },
  },
]

const quoteText = (text: string) =>
  text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n')

export const postRequestAcceptedMessage = async (
  params: ProcessingMessageParams,
) => {
  await postProcessingMessage({
    ...params,
    blocks: createTextBlocks(getCharacterMessage('request-accepted')),
  })
}

export const postAggregationProcessingMessage = async (
  params: ProcessingMessageParams,
) => {
  await postProcessingMessage({
    ...params,
    blocks: createTextBlocks(getCharacterMessage('aggregation-processing')),
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

export const postKotaeAcceptedMessage = async ({
  content,
  ...params
}: ProcessingMessageParams & {
  content: string
}) => {
  await postProcessingMessage({
    ...params,
    blocks: createTextBlocks(
      `${getCharacterMessage('kotae-accepted')}\n\n${quoteText(content)}`,
    ),
  })
}

export const postVoteAcceptedMessage = async ({
  content,
  voteRank,
  ...params
}: ProcessingMessageParams & {
  content: string
  voteRank: VoteCreateRequest['rank']
}) => {
  await postProcessingMessage({
    ...params,
    blocks: createTextBlocks(
      `${getCharacterMessage(
        'vote-accepted',
      )}\n\n${quoteText(content)}\n投票: ${convertVoteRankText(voteRank)}`,
    ),
  })
}
