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
        text: 'みなさーん！ 投票が始まりますよー！',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '回答の右のボタンを押すと投票できます！',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':point_right: :first_place_medal:*5P* (1票のみ) :second_place_medal:*3P* (1票のみ) :third_place_medal:*1P* (無制限)',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':warning: 同一回答への複数投票はできません:woman-gesturing-no:',
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
