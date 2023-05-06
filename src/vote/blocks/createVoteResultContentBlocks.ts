import { KnownBlock } from '@slack/types'
import { UsersInfoResponse } from '@slack/web-api'
import { UNKNOWN_USER_IMAGE_URL } from '../../conts'
import { RankedKotae } from '../../kotae/Kotae'
import { medalEmoji } from '../util'

type ResultType = 'point' | 'voted1stCount' | 'votedCount'

const createResultText = (ranked: RankedKotae, resultType: ResultType) => {
  switch (resultType) {
    case 'point':
      return `*${ranked.point}P* - :speaking_head_in_silhouette: *${ranked.content}*`
    case 'voted1stCount':
      return `:rocket: *${ranked.votedFirstCount}票* - :speaking_head_in_silhouette: *${ranked.content}*`
    case 'votedCount':
      return `*${ranked.votedCount}票* - :speaking_head_in_silhouette: *${ranked.content}*`
  }
}

const createHeaderText = (resultType: ResultType) => {
  switch (resultType) {
    case 'point':
      return ':100: :100: :100: *打点王(ポイント)* :100: :100: :100:'
    case 'voted1stCount':
      return ':volcano: :volcano: :volcano: *本塁打王(1位票数)* :volcano: :volcano: :volcano:'
    case 'votedCount':
      return ':scales: :scales: :scales: *首位打者(総票数)* :scales: :scales: :scales:'
  }
}

export const createVoteResultContentBlocks = ({
  rankedList,
  resultType,
  userInfoMap,
}: {
  rankedList: RankedKotae[]
  resultType: ResultType
  userInfoMap: { [userId: string]: UsersInfoResponse['user'] }
}): KnownBlock[] => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const rankedListBlocks: KnownBlock[] = rankedList
    .map((ranked) => {
      const userInfo = userInfoMap[ranked.createdBy]
      return [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${medalEmoji(ranked.rank)} ${createResultText(ranked, resultType)}`,
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
        },
      ]
    })
    .flat()
  rankedListBlocks.unshift({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: createHeaderText(resultType),
    },
  })
  rankedListBlocks.push({
    type: 'divider',
  })
  return rankedListBlocks
}
