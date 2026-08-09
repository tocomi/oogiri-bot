import { describe, expect, test } from 'vitest'

import { formatAdminUserName, formatAdminVoteRatio } from '../adminUserFormat'

describe('formatAdminUserName', () => {
  test('表示名があればそれを使う', () => {
    expect(formatAdminUserName({ name: 'たなか', userId: 'U1' })).toBe('たなか')
  })

  test('表示名を引けなければ ID を見せる', () => {
    expect(formatAdminUserName({ name: null, userId: 'U1' })).toBe('U1')
  })
})

describe('formatAdminVoteRatio', () => {
  test('回答 1 件あたりの票数を小数 2 桁で返す', () => {
    expect(formatAdminVoteRatio({ kotaeCount: 3, voteCount: 36 })).toBe('12.00')
    expect(formatAdminVoteRatio({ kotaeCount: 42, voteCount: 45 })).toBe('1.07')
  })

  test('回答していない人は比を出さない', () => {
    expect(formatAdminVoteRatio({ kotaeCount: 0, voteCount: 12 })).toBe('—')
  })
})
