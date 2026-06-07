// TODO: クライアント側とファイルが重複している

import { Kotae } from '../Kotae'

const FIRST_RANK_POINT = 5
const SECOND_RANK_POINT = 3
const THIRD_RANK_POINT = 1

export const makePointedList = <T extends Kotae>({
  kotaeList,
}: {
  kotaeList: T[]
  removeNoVoteKotae?: boolean
}): (T & { point: number })[] => {
  return kotaeList.map((kotae) => {
    const point =
      FIRST_RANK_POINT * kotae.votedFirstCount +
      SECOND_RANK_POINT * kotae.votedSecondCount +
      THIRD_RANK_POINT * kotae.votedThirdCount
    return {
      ...kotae,
      point,
    }
  })
}
