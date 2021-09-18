import { Kotae, RankedKotae } from './Kotae'

const FIRST_RANK_POINT = 5
const SECOND_RANK_POINT = 3
const THIRD_RANK_POINT = 1

export const makePointRanking = ({
  kotaeList,
  removeNoVoteKotae = true,
}: {
  kotaeList: Kotae[]
  removeNoVoteKotae?: boolean
}): RankedKotae[] => {
  let rank: RankedKotae['rank'] = 1
  let beforePoint = 0
  let stockRank = 1
  const rankedList = kotaeList
    .filter((kotae) => {
      if (!removeNoVoteKotae) return true
      return kotae.votedCount > 0
    })
    .map((kotae) => {
      const point =
        FIRST_RANK_POINT * kotae.votedFirstCount +
        SECOND_RANK_POINT * kotae.votedSecondCount +
        THIRD_RANK_POINT * kotae.votedThirdCount
      return {
        ...kotae,
        point,
      }
    })
    .sort((a, b) => {
      return a.point > b.point ? -1 : 1
    })
    .map((kotae) => {
      if (beforePoint > 0) {
        if (beforePoint === kotae.point) {
          stockRank += 1
        } else {
          rank += stockRank
          stockRank = 1
        }
      }
      beforePoint = kotae.point
      const ranked = {
        ...kotae,
        rank,
      }
      return ranked
    })
    .filter((kotae) => kotae.rank <= 3)
  return rankedList
}
