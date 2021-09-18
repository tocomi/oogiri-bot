import { Kotae, RankedKotae } from '../Kotae'
import { makePointedList } from './makePointedList'

export const make1stVotedCountRanking = ({ kotaeList }: { kotaeList: Kotae[] }): RankedKotae[] => {
  const filteredList = kotaeList.filter((kotae) => {
    return kotae.votedCount > 0
  })
  const pointedList = makePointedList({ kotaeList: filteredList })

  let rank: RankedKotae['rank'] = 1
  let beforeCount = 0
  let stockRank = 1
  return pointedList
    .sort((a, b) => {
      return a.votedFirstCount > b.votedFirstCount ? -1 : 1
    })
    .map((kotae) => {
      if (beforeCount > 0) {
        if (beforeCount === kotae.votedFirstCount) {
          stockRank += 1
        } else {
          rank += stockRank
          stockRank = 1
        }
      }
      beforeCount = kotae.votedFirstCount
      const ranked = {
        ...kotae,
        rank,
      }
      return ranked
    })
    .filter((kotae) => kotae.rank <= 3)
}
