import { KnownBlock } from '@slack/types'
import { VoteCount } from '../Vote'

const KEKKA_IMAGE_URL = 'https://i.imgur.com/6qUQaQA.jpeg'

type KotaeCountSummary = {
  uniqueUserCount: number
  kotaeCount: number
}

export const createVoteResultHeaderBlocks = ({
  odaiTitle,
  imageUrl,
  kotaeCount,
  voteCount,
}: {
  odaiTitle: string
  imageUrl?: string
  kotaeCount: KotaeCountSummary
  voteCount: VoteCount
}): KnownBlock[] => {
  const blocks: KnownBlock[] = []
  blocks.push(
    {
      type: 'image',
      image_url: KEKKA_IMAGE_URL,
      alt_text: 'hamata',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:speech_balloon: *お題: ${odaiTitle}*`,
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
        text: `:ninja: 回答参加者: ${kotaeCount.uniqueUserCount}人 :speaking_head_in_silhouette: 総回答数: ${kotaeCount.kotaeCount}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:male_genie: 投票参加者: ${voteCount.uniqueUserCount}人 :point_up: 総投票数: ${voteCount.voteCount}`,
      },
    },
    {
      type: 'divider',
    },
  )
  return blocks
}
