import { describe, expect, test } from 'vitest'

import type { AdminUserStatsItem } from '@/features/users/api/adminUsers'

import { parseAdminUserSort, sortAdminUsers } from '../adminUserSort'

const createItem = (
  overrides: Partial<AdminUserStatsItem> = {},
): AdminUserStatsItem => ({
  userId: 'U1',
  name: 'たなか',
  kotaeCount: 0,
  voteCount: 0,
  kotaeOdaiCount: 0,
  voteOdaiCount: 0,
  ...overrides,
})

describe('parseAdminUserSort', () => {
  test('指定された並びを受け取る', () => {
    expect(parseAdminUserSort('vote')).toBe('vote')
    expect(parseAdminUserSort('kotae')).toBe('kotae')
  })

  test('未指定や不正な値は回答数の並びに倒す', () => {
    expect(parseAdminUserSort(null)).toBe('kotae')
    expect(parseAdminUserSort('point')).toBe('kotae')
  })
})

describe('sortAdminUsers', () => {
  const items = [
    createItem({ userId: 'U1', kotaeCount: 9, voteCount: 33 }),
    createItem({ userId: 'U2', kotaeCount: 42, voteCount: 12 }),
    createItem({ userId: 'U3', kotaeCount: 24, voteCount: 45 }),
  ]

  test('回答数の多い順に並べる', () => {
    expect(sortAdminUsers(items, 'kotae').map((item) => item.userId)).toEqual([
      'U2',
      'U3',
      'U1',
    ])
  })

  test('投票数の多い順に並べる', () => {
    expect(sortAdminUsers(items, 'vote').map((item) => item.userId)).toEqual([
      'U3',
      'U1',
      'U2',
    ])
  })

  test('同数ならもう一方の指標で決める', () => {
    const tied = [
      createItem({ userId: 'U1', kotaeCount: 10, voteCount: 1 }),
      createItem({ userId: 'U2', kotaeCount: 10, voteCount: 5 }),
    ]

    expect(sortAdminUsers(tied, 'kotae').map((item) => item.userId)).toEqual([
      'U2',
      'U1',
    ])
  })

  test('元の配列を変更しない', () => {
    const original = [...items]
    sortAdminUsers(items, 'vote')

    expect(items).toEqual(original)
  })
})
