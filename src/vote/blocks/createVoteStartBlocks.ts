import { KnownBlock } from '@slack/types'

export const createVoteStartBlocks = ({
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
        text: ':mega: :mega: :mega: *投票が開始されました！* :mega: :mega: :mega:',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '面白いと思った回答に投票しましょう！',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '回答の右のボタンを押すと投票できます:punch: (複数投票可)',
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
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '---',
    },
  })
  return blocks
}
