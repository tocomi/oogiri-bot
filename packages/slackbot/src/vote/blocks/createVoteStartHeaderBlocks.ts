import { KnownBlock } from '@slack/types'
import { getCharacterMessage } from '../../message'

export const createVoteStartHeaderBlocks = ({
  title,
  imageUrl = '',
}: {
  title: string
  imageUrl?: string
}): KnownBlock[] => {
  const blocks: KnownBlock[] = []
  blocks.push(
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '<!here>',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: getCharacterMessage('vote-start'),
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:speech_balloon: *お題: ${title}*`,
      },
    }
  )
  if (imageUrl) {
    blocks.push({
      type: 'image',
      image_url: imageUrl,
      alt_text: 'odai image',
    })
  }
  blocks.push({
    type: 'divider',
  })
  return blocks
}
