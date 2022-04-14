import { KnownBlock } from '@slack/types'

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
        text: 'みなさーん！ 投票が始まりますよー！',
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
