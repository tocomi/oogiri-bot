import { RankedKotae } from '../../Kotae'
import { makeVoted1stCountRanking } from '../makeVoted1stCountRanking'
import { makeVotedCountRanking } from '../makeVotedCountRanking'

const kotae10 = {
  content: '10',
  createdBy: 'U5S9CURD2',
  votedCount: 3,
  votedFirstCount: 3,
  votedSecondCount: 0,
  votedThirdCount: 0,
  createdAt: 1625889428995,
  votedByList: [],
}

const kotae20 = {
  content: '20',
  createdBy: 'U5S9CURD2',
  votedCount: 6,
  votedFirstCount: 2,
  votedSecondCount: 4,
  votedThirdCount: 0,
  createdAt: 1625889428995,
  votedByList: [],
}

const kotae30 = {
  content: '30',
  createdBy: 'U5S9CURD2',
  votedCount: 8,
  votedFirstCount: 1,
  votedSecondCount: 4,
  votedThirdCount: 3,
  createdAt: 1625889428995,
  votedByList: [],
}

const kotae31 = {
  content: '31',
  createdBy: 'U5S9CURD2',
  votedCount: 9,
  votedFirstCount: 1,
  votedSecondCount: 7,
  votedThirdCount: 1,
  createdAt: 1625889428995,
  votedByList: [],
}

const kotae40 = {
  content: '40',
  createdBy: 'U5S9CURD2',
  votedCount: 12,
  votedFirstCount: 0,
  votedSecondCount: 10,
  votedThirdCount: 2,
  createdAt: 1625889428995,
  votedByList: [],
}

const kotaeList = [kotae10, kotae20, kotae30, kotae31, kotae40]

describe('順位の計算', () => {
  test('1位投票数の順位が正しく計算される', () => {
    const result = makeVoted1stCountRanking({ kotaeList })
    const expected: RankedKotae[] = [
      {
        ...kotae10,
        point: 15,
        rank: 1,
        votedByList: [],
      },
      {
        ...kotae20,
        point: 22,
        rank: 2,
        votedByList: [],
      },
      {
        ...kotae30,
        point: 20,
        rank: 3,
        votedByList: [],
      },
      {
        ...kotae31,
        point: 27,
        rank: 3,
        votedByList: [],
      },
    ]
    expect(result).toStrictEqual(expected)
  })

  test('総投票数の順位が正しく計算される', () => {
    const result = makeVotedCountRanking({ kotaeList })
    const expected: RankedKotae[] = [
      {
        ...kotae40,
        point: 32,
        rank: 1,
        votedByList: [],
      },
      {
        ...kotae31,
        point: 27,
        rank: 2,
        votedByList: [],
      },
      {
        ...kotae30,
        point: 20,
        rank: 3,
        votedByList: [],
      },
    ]
    expect(result).toStrictEqual(expected)
  })
})
