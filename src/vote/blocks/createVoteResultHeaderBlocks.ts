import { KnownBlock } from '@slack/types'
import { KotaeCount } from '../../kotae/Kotae'
import { VoteCount } from '../Vote'

export const createVoteResultHeaderBlocks = ({
  odaiTitle,
  imageUrl,
  kotaeCount,
  voteCount,
}: {
  odaiTitle: string
  imageUrl?: string
  kotaeCount: KotaeCount
  voteCount: VoteCount
}): KnownBlock[] => {
  const blocks: KnownBlock[] = []
  blocks.push(
    {
      type: 'image',
      image_url:
        'https://stat.ameba.jp/user_images/20200706/09/lymph2/9e/3e/j/o1280072014784922530.jpg',
      alt_text: 'inspiration',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:speech_balloon: *お題: ${odaiTitle}*`,
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
    }
  )
  return blocks
}
