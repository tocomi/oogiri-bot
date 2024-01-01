import { KnownBlock } from '@slack/types'
import { getCharacterMessage } from '../../message'

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
        text: getCharacterMessage('vote-description'),
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
