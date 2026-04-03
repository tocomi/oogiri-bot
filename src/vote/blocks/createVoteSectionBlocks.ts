import { KnownBlock } from '@slack/types'
import { convertVoteRankText } from '../convertVoteValue'

const ACTION_ID = 'vote-kotae'

export const createVoteSectionBlocks = ({
  kotaeContent,
}: {
  kotaeContent: string
}): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:speaking_head_in_silhouette: *${kotaeContent}*`,
    },
    accessory: {
      type: 'overflow',
      options: [
        {
          text: {
            type: 'plain_text',
            text: `:first_place_medal: ${convertVoteRankText(1)} - 1票のみ`,
          },
          value: 'first-rank-vote',
        },
        {
          text: {
            type: 'plain_text',
            text: `:second_place_medal: ${convertVoteRankText(2)} - 1票のみ`,
          },
          value: 'second-rank-vote',
        },
        {
          text: {
            type: 'plain_text',
            text: `:third_place_medal: ${convertVoteRankText(3)} - 複数投票可`,
          },
          value: 'third-rank-vote',
        },
      ],
      action_id: ACTION_ID,
    },
  },
]
