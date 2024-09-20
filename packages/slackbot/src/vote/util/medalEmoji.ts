import { RankedKotae } from '../../kotae/Kotae'

export const medalEmoji = (rank: RankedKotae['rank']) => {
  switch (rank) {
    case 1:
      return ':first_place_medal:'
    case 2:
      return ':second_place_medal:'
    case 3:
      return ':third_place_medal:'
  }
}
