import { RankedKotae } from '../../Kotae'
import { makePointRanking } from '../makePointRanking'

const kotae00 = {
  id: 'kotae00',
  content: 'ナマステ',
  createdBy: 'U5S9CURD2',
  votedCount: 0,
  votedFirstCount: 0,
  votedSecondCount: 0,
  votedThirdCount: 0,
  createdAt: 1625889428995,
  votedByList: [],
}

const kotae01 = {
  id: 'kotae01',
  content: '相当な猛者',
  createdBy: 'U5S9CURD2',
  votedCount: 0,
  votedFirstCount: 0,
  votedSecondCount: 0,
  votedThirdCount: 0,
  createdAt: 1626181675614,
  votedByList: [],
}

const kotae10 = {
  id: 'kotae10',
  content: 'なかなかにやばい',
  createdBy: 'U5S9CURD2',
  votedCount: 2,
  votedFirstCount: 2,
  votedSecondCount: 0,
  votedThirdCount: 0,
  createdAt: 1626181663621,
  votedByList: [],
}

const kotae11 = {
  id: 'kotae11',
  content: '店長がダルい',
  createdBy: 'A123456',
  votedCount: 2,
  votedFirstCount: 2,
  votedSecondCount: 0,
  votedThirdCount: 0,
  createdAt: 1625578388545,
  votedByList: [],
}

const kotae20 = {
  id: 'kotae20',
  content: 'ハンパねぇ',
  createdBy: 'A123456',
  votedCount: 4,
  votedFirstCount: 0,
  votedSecondCount: 2,
  votedThirdCount: 2,
  createdAt: 1625578388545,
  votedByList: [],
}

const kotae21 = {
  id: 'kotae21',
  content: 'ウルトラソウル',
  createdBy: 'U5S9CURD2',
  votedCount: 4,
  votedFirstCount: 0,
  votedSecondCount: 2,
  votedThirdCount: 2,
  createdAt: 1626181663621,
  votedByList: [],
}

const kotae30 = {
  id: 'kotae30',
  content:
    '長い回答長い回答長い回答長い回答長い回答長い回答長い回答長い回答長い回答長い回答長い回答',
  createdBy: 'A123456',
  votedCount: 6,
  votedFirstCount: 0,
  votedSecondCount: 0,
  votedThirdCount: 6,
  createdAt: 1625578405605,
  votedByList: [],
}

const kotae31 = {
  id: 'kotae31',
  content: 'めちゃくちゃたくましい',
  createdBy: 'A123456',
  votedCount: 6,
  votedFirstCount: 0,
  votedSecondCount: 0,
  votedThirdCount: 6,
  createdAt: 1625578403499,
  votedByList: [],
}

describe('ポイントと順位の計算', () => {
  test('ポイント順に並び替えとランク付けが行われる', () => {
    const result = makePointRanking({ kotaeList: [kotae10, kotae20, kotae30] })
    const expected: RankedKotae[] = [
      {
        ...kotae10,
        rank: 1,
        point: 10,
      },
      {
        ...kotae20,
        rank: 2,
        point: 8,
      },
      {
        ...kotae30,
        rank: 3,
        point: 6,
      },
    ]
    expect(result).toStrictEqual(expected)
  })

  test('0票の回答は除外される', () => {
    const result = makePointRanking({ kotaeList: [kotae00, kotae01, kotae10, kotae20] })
    const expected: RankedKotae[] = [
      {
        ...kotae10,
        rank: 1,
        point: 10,
      },
      {
        ...kotae20,
        rank: 2,
        point: 8,
      },
    ]
    expect(result).toStrictEqual(expected)
  })

  test('ポイントが同値の場合は同じ順位になる', () => {
    const result = makePointRanking({
      kotaeList: [kotae00, kotae01, kotae10, kotae11, kotae20, kotae21, kotae30, kotae31],
    })
    const expected: RankedKotae[] = [
      {
        ...kotae10,
        rank: 1,
        point: 10,
      },
      {
        ...kotae11,
        rank: 1,
        point: 10,
      },
      {
        ...kotae20,
        rank: 3,
        point: 8,
      },
      {
        ...kotae21,
        rank: 3,
        point: 8,
      },
    ]
    expect(result).toStrictEqual(expected)
  })
})
