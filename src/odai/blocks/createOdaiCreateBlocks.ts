import { KnownBlock } from '@slack/types'
import { milliSecondsToYYYYMMDD } from '../../util/DateUtil'

export const createOdaiCreateBlocks = ({
  title,
  dueDate,
}: {
  title: string
  dueDate: string
}): KnownBlock[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `<!here>`,
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '新しいお題が設定されたよ〜 みんなドシドシ回答してね！',
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
      text: `:calendar: *回答期限: ${milliSecondsToYYYYMMDD(dueDate)}*`,
    },
  },
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'お題に回答する (複数回答可)',
        },
        style: 'primary',
        action_id: 'oogiri-create-kotae',
      },
    ],
  },
]
