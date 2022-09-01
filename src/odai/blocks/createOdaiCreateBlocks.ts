import { KnownBlock } from '@slack/types'
import { CREATE_KOTAE_ACTION_ID } from '../../kotae/KotaeAction'
import { milliSecondsToYYYYMMDD } from '../../util/DateUtil'

export const createOdaiCreateBlocks = ({
  title,
  dueDate,
  imageUrl = '',
}: {
  title: string
  dueDate: string
  imageUrl?: string
}): KnownBlock[] => {
  const blocks: KnownBlock[] = []
  blocks.push(
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
        text: `みなさーん、新しいお題が発表されました！ ドシドシ回答してください！`,
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
  blocks.push(
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
            text: 'お題に回答する！ (複数回答可)',
          },
          style: 'primary',
          action_id: CREATE_KOTAE_ACTION_ID,
        },
      ],
    }
  )
  return blocks
}
