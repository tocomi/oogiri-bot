import { KnownBlock } from '@slack/types'

export const createVoteResultFooterBlocks = (): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '今回はこのような結果になりました、入賞者の方々おめでとうございます！ :clap:',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '次回も奮って参加してくださいね！ :raised_hands:',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '個人の結果は `/oogiri-check-my-result` で確認できます！ (他の人には見えません:ok_woman:)',
    },
  },
]
