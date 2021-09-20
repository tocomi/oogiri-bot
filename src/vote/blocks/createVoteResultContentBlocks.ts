import { KnownBlock } from '@slack/types'
import { RankedKotae } from '../../kotae/Kotae'

type ResultType = 'point' | 'voted1stCount' | 'votedCount'

const medalEmoji = (rank: RankedKotae['rank']) => {
  switch (rank) {
    case 1:
      return ':first_place_medal:'
    case 2:
      return ':second_place_medal:'
    case 3:
      return ':third_place_medal:'
  }
}

const createResultText = (ranked: RankedKotae, resultType: ResultType) => {
  switch (resultType) {
    case 'point':
      return `:dart: *${ranked.point}P* - :speaking_head_in_silhouette: *${ranked.content}*`
    case 'voted1stCount':
      return `:rocket: *${ranked.votedFirstCount}票* - :speaking_head_in_silhouette: *${ranked.content}*`
    case 'votedCount':
      return `:point_up: *${ranked.votedCount}票* - :speaking_head_in_silhouette: *${ranked.content}*`
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
}: {
  rankedList: RankedKotae[]
  resultType: ResultType
}): KnownBlock[] => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const rankedListBlocks: KnownBlock[] = rankedList
    .map((ranked) => {
      return [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${medalEmoji(ranked.rank)} *第${ranked.rank}位* <@${ranked.createdBy}>`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: createResultText(ranked, resultType),
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `-`,
          },
        },
      ]
    })
    .flat()
  // NOTE: 最後のハイフンのブロックは不要
  rankedListBlocks.pop()
  rankedListBlocks.unshift({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: createHeaderText(resultType),
    },
  })
  rankedListBlocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '-'.repeat(50),
    },
  })
  return rankedListBlocks
}
