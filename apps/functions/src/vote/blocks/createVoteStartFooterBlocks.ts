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
        text: ':repeat: 投票はあとから変更できます。投票済みの回答で別の賞を選ぶと付け替わり、:first_place_medal: :second_place_medal: を別の回答に入れ直すと元の回答は一段下がります',
      },
    },
  )
  return blocks
}
