import { KnownBlock } from '@slack/types'

export const createVoteStartFooterBlocks = (): KnownBlock[] => {
  const blocks: KnownBlock[] = []
  blocks.push(
    {
      type: 'divider',
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
    }
  )
  return blocks
}
