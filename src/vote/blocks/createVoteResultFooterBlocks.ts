import { KnownBlock } from '@slack/types'

export const createVoteResultFooterBlocks = (): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '入賞者の方々おめでとうございます！ :clap: :clap: :clap:',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '次回も奮ってご参加ください！ :muscle: :muscle: :muscle:',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '個人の結果はコマンド `/oogiri-check-my-result` で確認できます。(他の人には見えません)',
    },
  },
]
