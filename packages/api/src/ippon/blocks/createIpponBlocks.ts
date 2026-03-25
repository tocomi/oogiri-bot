import { KnownBlock } from '@slack/types'

export const createIpponBlocks = ({
  userId,
  kotaeContent,
}: {
  userId: string
  kotaeContent: string
}): KnownBlock[] => [
  {
    type: 'image',
    image_url: 'https://i.imgur.com/vl4rd2j.jpg',
    alt_text: 'ippon',
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${kotaeContent}* by <@${userId}>`,
    },
  },
]
