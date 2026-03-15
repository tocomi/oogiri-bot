import { KnownBlock } from '@slack/types'
import { buildCommentatorSectionBlocks } from '../../commentary/buildCommentatorSectionBlocks'
import { CommentatorCommentary } from '../../odai/Odai'

export const createAiCommentaryBlocks = (
  commentary?: CommentatorCommentary,
): KnownBlock[] => {
  if (!commentary) return []

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':microphone: *有識者による講評*',
      },
    },
    ...buildCommentatorSectionBlocks(commentary),
    {
      type: 'divider',
    },
  ]
}
