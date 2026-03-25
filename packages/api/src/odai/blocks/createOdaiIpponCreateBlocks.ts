import { KnownBlock } from '@slack/types'
import { getCharacterMessage } from '../../message'

// NOTE: KotaeHandlerのCREATE_KOTAE_ACTION_IDに対応
const CREATE_KOTAE_ACTION_ID = 'oogiri-create-kotae'

export const createOdaiIpponCreateBlocks = ({
  title,
  ipponVoteCount,
  winIpponCount,
  imageUrl = '',
}: {
  title: string
  ipponVoteCount: number
  winIpponCount: number
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
        text: getCharacterMessage('ippon-odai-start'),
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:speech_balloon: *お題: ${title}*`,
      },
    },
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
        text: `:tada: IPPONに必要な投票: *${ipponVoteCount}*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:trophy: 優勝に必要なIPPON: *${winIpponCount}*`,
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
    },
  )
  return blocks
}
