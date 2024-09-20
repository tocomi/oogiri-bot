import { KnownBlock } from '@slack/web-api'
import { KEKKA_IMAGE_URL } from '../../const'

export const createWinHeaderBlocks = ({
  odaiTitle,
  odaiImageUrl,
  kotaeCounts,
  voteCounts,
}: {
  odaiTitle: string
  odaiImageUrl?: string
  kotaeCounts: { uniqueUserCount: number; kotaeCount: number }
  voteCounts: { uniqueUserCount: number; voteCount: number }
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
    }
  )
  if (odaiImageUrl) {
    blocks.push({
      type: 'image',
      image_url: odaiImageUrl,
      alt_text: 'odai image',
    })
  }
  blocks.push(
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:ninja: 回答参加者: ${kotaeCounts.uniqueUserCount}人 :speaking_head_in_silhouette: 総回答数: ${kotaeCounts.kotaeCount}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:male_genie: 投票参加者: ${voteCounts.uniqueUserCount}人 :point_up: 総投票数: ${voteCounts.voteCount}`,
      },
    },
    {
      type: 'divider',
    }
  )
  return blocks
}
