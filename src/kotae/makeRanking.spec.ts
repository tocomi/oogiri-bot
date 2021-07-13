import { RankedKotae } from './Kotae'
import { makeRanking } from './makeRanking'

const kotae00 = {
  content: 'ナマステ',
  createdBy: 'U5S9CURD2',
  votedCount: 0,
  createdAt: 1625889428995,
}

const kotae01 = {
  content: '相当な猛者',
  createdBy: 'U5S9CURD2',
  votedCount: 0,
  createdAt: 1626181675614,
}

const kotae10 = {
  content: 'なかなかにやばい',
  createdBy: 'U5S9CURD2',
  votedCount: 1,
  createdAt: 1626181663621,
}

const kotae11 = {
  content: '店長がダルい',
  createdBy: 'A123456',
  votedCount: 1,
  createdAt: 1625578388545,
}

const kotae20 = {
  content: 'ハンパねぇ',
  createdBy: 'A123456',
  votedCount: 2,
  createdAt: 1625578388545,
}

const kotae21 = {
  content: 'ウルトラソウル',
  createdBy: 'U5S9CURD2',
  votedCount: 2,
  createdAt: 1626181663621,
}

const kotae30 = {
  content:
    '長い回答長い回答長い回答長い回答長い回答長い回答長い回答長い回答長い回答長い回答長い回答',
  createdBy: 'A123456',
  votedCount: 3,
  createdAt: 1625578405605,
}

const kotae31 = {
  content: 'めちゃくちゃたくましい',
  createdBy: 'A123456',
  votedCount: 3,
  createdAt: 1625578403499,
}

test('投票数順に並び替えとランク付けが行われる', () => {
  const result = makeRanking([kotae10, kotae20, kotae30])
  const expected: RankedKotae[] = [
    {
      ...kotae30,
      rank: 1,
    },
    {
      ...kotae20,
      rank: 2,
    },
    {
      ...kotae10,
      rank: 3,
    },
  ]
  expect(result).toBe(expected)
})

test('0票の回答は除外される', () => {
  const result = makeRanking([kotae00, kotae01, kotae10, kotae20])
  const expected: RankedKotae[] = [
    {
      ...kotae20,
      rank: 1,
    },
    {
      ...kotae10,
      rank: 2,
    },
  ]
  expect(result).toBe(expected)
})

test('票数が同数の場合は同じ順位になる', () => {
  const result = makeRanking([
    kotae00,
    kotae01,
    kotae10,
    kotae11,
    kotae20,
    kotae21,
    kotae30,
    kotae31,
  ])
  const expected: RankedKotae[] = [
    {
      ...kotae30,
      rank: 1,
    },
    {
      ...kotae31,
      rank: 1,
    },
    {
      ...kotae20,
      rank: 3,
    },
    {
      ...kotae21,
      rank: 3,
    },
  ]
  expect(result).toBe(expected)
})
