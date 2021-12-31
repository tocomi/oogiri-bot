import { KnownBlock } from '@slack/types'

export const createVoteStartBlocks = ({ title }: { title: string }): KnownBlock[] => [
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
      text: 'みんな〜！ 投票が始まるよ〜！',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '回答の右のボタンを押して投票してね！ 複数の回答に投票できるよ！',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:speech_balloon: *お題: ${title}*`,
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '---',
    },
  },
]
