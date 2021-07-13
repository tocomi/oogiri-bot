import { Kotae, RankedKotae } from './Kotae'

export const makeRanking = (kotaeList: Kotae[]): RankedKotae[] => {
  const sortedList = kotaeList.sort((a, b) => {
    return a.votedCount > b.votedCount ? -1 : 1
  })
  let rank: RankedKotae['rank'] = 1
  let beforeCount = 0
  let stockRank = 1
  const rankedList = sortedList
    .filter((kotae) => kotae.votedCount > 0)
    .map((kotae) => {
      if (beforeCount > 0) {
        if (beforeCount === kotae.votedCount) {
          stockRank += 1
        } else {
          rank += stockRank
          stockRank = 1
        }
      }
      beforeCount = kotae.votedCount
      const ranked = {
        ...kotae,
        rank,
      }
      return ranked
    })
    .filter((kotae) => kotae.rank <= 3)
  return rankedList
}
