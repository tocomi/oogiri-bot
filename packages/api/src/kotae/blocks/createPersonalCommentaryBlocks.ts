import { KnownBlock } from '@slack/types'
import { buildCommentatorSectionBlocks } from '../../commentary/buildCommentatorSectionBlocks'
import { CommentatorCommentary } from '../../odai/Odai'

export const createPersonalCommentaryBlocks = (
  odaiTitle: string,
  commentary: CommentatorCommentary,
): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:memo: *あなたの回答への講評 - お題: ${odaiTitle}*`,
    },
  },
  ...buildCommentatorSectionBlocks(commentary),
  {
    type: 'divider',
  },
]
