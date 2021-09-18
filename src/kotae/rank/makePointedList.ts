import { Kotae, PointedKotae } from '../Kotae'

const FIRST_RANK_POINT = 5
const SECOND_RANK_POINT = 3
const THIRD_RANK_POINT = 1

export const makePointedList = ({
  kotaeList,
}: {
  kotaeList: Kotae[]
  removeNoVoteKotae?: boolean
}): PointedKotae[] => {
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
