import { Kotae, RankedKotae } from '../Kotae'
import { makePointedList } from './makePointedList'

export const makePointRanking = ({
  kotaeList,
  removeNoVoteKotae = true,
}: {
  kotaeList: Kotae[]
  removeNoVoteKotae?: boolean
}): RankedKotae[] => {
  const filteredList = kotaeList.filter((kotae) => {
    if (!removeNoVoteKotae) return true
    return kotae.votedCount > 0
  })
  const pointedList = makePointedList({ kotaeList: filteredList })

  let rank: RankedKotae['rank'] = 1
  let beforePoint = 0
  let stockRank = 1
  return pointedList
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
}
