import { KnownBlock } from '@slack/types'

export const createAiCommentaryBlocks = (commentary?: string): KnownBlock[] => {
  if (!commentary) return []

  // 段落ごとに分割
  const paragraphs = commentary.split('\n\n').filter((p) => p.trim().length > 0)

  const blocks: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':robot_face: *笑撃のAI-GOROによる講評* :bulb:',
      },
    },
  ]

  // 各段落をブロックとして追加
  paragraphs.forEach((paragraph) => {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: paragraph,
      },
    })
  })

  blocks.push({
    type: 'divider',
  })

  return blocks
}
