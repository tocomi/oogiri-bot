import { KnownBlock } from '@slack/types'
import { CommentatorCommentary } from '../../odai/Odai'

export const createAiCommentaryBlocks = (commentary?: CommentatorCommentary): KnownBlock[] => {
  if (!commentary) return []

  const blocks: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':microphone: *有識者による講評*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:fire: *松本人志*\n${commentary.matsumoto}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:brain: *バカリズム*\n${commentary.bakarism}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:giraffe_face: *麒麟川島*\n${commentary.kawashima}`,
      },
    },
    {
      type: 'divider',
    },
  ]

  return blocks
}
