import { KnownBlock } from '@slack/types'
import { CommentatorCommentary } from '../odai/Odai'

const COMMENTATOR_DISPLAY: {
  id: keyof CommentatorCommentary
  emoji: string
  name: string
}[] = [
  { id: 'matsumoto', emoji: ':fire:', name: '松本人志' },
  { id: 'bakarism', emoji: ':brain:', name: 'バカリズム' },
  { id: 'kawashima', emoji: ':giraffe_face:', name: '麒麟川島' },
]

export const buildCommentatorSectionBlocks = (
  commentary: CommentatorCommentary,
): KnownBlock[] =>
  COMMENTATOR_DISPLAY.map((c) => ({
    type: 'section' as const,
    text: {
      type: 'mrkdwn' as const,
      text: `${c.emoji} *${c.name}*\n${commentary[c.id]}`,
    },
  }))
