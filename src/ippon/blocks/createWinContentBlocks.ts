import { KnownBlock, UsersInfoResponse } from '@slack/web-api'
import { UNKNOWN_USER_IMAGE_URL } from '../../conts'

export const createWinContentBlocks = ({
  ipponCountList,
  userInfoMap,
}: {
  ipponCountList: {
    userId: string
    ipponCount: number
  }[]
  userInfoMap: { [userId: string]: UsersInfoResponse['user'] }
}): KnownBlock[] => {
  const blocks: KnownBlock[] = []
  ipponCountList.map((ipponCount) => {
    const userInfo = userInfoMap[ipponCount.userId]
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:trophy: ${ipponCount.ipponCount}回`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'image',
            image_url: userInfo?.profile?.image_32 || UNKNOWN_USER_IMAGE_URL,
            alt_text: 'user_image',
          },
          {
            type: 'mrkdwn',
            text: userInfo?.profile?.display_name || 'unknown',
          },
        ],
      }
    )
  })
  return blocks
}
