import { describe, expect, test } from 'vitest'

import type { AdminUserStats } from '@/features/users/api/adminUsers'

import {
  ADMIN_USER_ANONYMOUS_VALUE,
  anonymizeAdminUserStats,
  createAdminUserHref,
  parseAdminUserAnonymous,
} from '../adminUserPrivacy'

const STATS: AdminUserStats = {
  odaiCount: 2,
  items: [
    {
      userId: 'U1',
      name: 'たなか',
      kotaeCount: 3,
      voteCount: 2,
      postedOdaiCount: 1,
      kotaeOdaiCount: 2,
      voteOdaiCount: 1,
    },
    {
      userId: 'U2',
      name: null,
      kotaeCount: 1,
      voteCount: 4,
      postedOdaiCount: 0,
      kotaeOdaiCount: 1,
      voteOdaiCount: 2,
    },
  ],
}

describe('adminUserPrivacy', () => {
  test('匿名モードではすべての表示名を匿名ラベルに置き換える', () => {
    const anonymized = anonymizeAdminUserStats(STATS)
    const names = anonymized.items.map((item) => item.name)
    const stringNames = names.filter((name): name is string => name !== null)

    expect(names).toHaveLength(2)
    expect(stringNames).toHaveLength(names.length)
    expect(new Set(stringNames).size).toBe(stringNames.length)
    expect(stringNames.every((name) => name.endsWith('さん'))).toBe(true)
    expect(stringNames).not.toContain('たなか')
    expect(anonymized.items[0]?.kotaeCount).toBe(3)
    expect(STATS.items[0]?.name).toBe('たなか')
  })

  test('匿名モードの URL パラメータだけを有効として扱う', () => {
    expect(parseAdminUserAnonymous(ADMIN_USER_ANONYMOUS_VALUE)).toBe(true)
    expect(parseAdminUserAnonymous(null)).toBe(false)
    expect(parseAdminUserAnonymous('true')).toBe(false)
  })

  test('ユーザー分析内のリンクに匿名モードを引き継ぐ', () => {
    expect(
      createAdminUserHref({
        anonymous: true,
        period: '2026',
        sort: 'vote',
      }),
    ).toBe('/users?period=2026&sort=vote&anonymous=1')
    expect(
      createAdminUserHref({
        anonymous: false,
        period: 'all',
        sort: 'kotae',
      }),
    ).toBe('/users?period=all&sort=kotae')
  })
})
