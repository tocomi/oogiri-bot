import { Kotae, RankedKotae } from './Kotae'

export const makeRanking = (kotaeList: Kotae[]): RankedKotae[] => {
  const sortedList = kotaeList.sort((a, b) => {
    return a.votedCount > b.votedCount ? -1 : 1
  })
  let rank: RankedKotae['rank'] = 1
  const rankedList = sortedList.map((kotae) => {
    const ranked = {
      ...kotae,
      rank,
    }
    rank += 1
    return ranked
  })
  return rankedList
}
