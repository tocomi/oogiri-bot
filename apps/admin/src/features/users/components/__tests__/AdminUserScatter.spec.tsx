import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import type { AdminUserStatsItem } from '@/features/users/api/adminUsers'

import { AdminUserScatter } from '../AdminUserScatter'

const createItem = (
  overrides: Partial<AdminUserStatsItem> = {},
): AdminUserStatsItem => ({
  userId: 'U1',
  name: 'たなか',
  kotaeCount: 42,
  voteCount: 45,
  postedOdaiCount: 8,
  kotaeOdaiCount: 15,
  voteOdaiCount: 15,
  ...overrides,
})

/** 回答寄り・投票寄り・最多の 3 人が揃った母集団 */
const ITEMS = [
  createItem(),
  createItem({
    userId: 'U2',
    name: 'やまだ',
    kotaeCount: 24,
    voteCount: 12,
  }),
  createItem({
    userId: 'U3',
    name: 'まつもと',
    kotaeCount: 3,
    voteCount: 36,
  }),
]

describe('AdminUserScatter', () => {
  test('ユーザーごとに読み上げられる点を置く', async () => {
    const screen = await render(<AdminUserScatter items={ITEMS} />)

    await expect
      .element(screen.getByLabelText('たなか 回答 42 投票 45'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByLabelText('まつもと 回答 3 投票 36'))
      .toBeInTheDocument()
  })

  test('偏りが大きい人には直接ラベルを付ける', async () => {
    const screen = await render(<AdminUserScatter items={ITEMS} />)

    // 投票寄りの端と回答寄りの端が図の主張になる
    await expect.element(screen.getByText('まつもと')).toBeVisible()
    await expect.element(screen.getByText('やまだ')).toBeVisible()
  })

  test('点にフォーカスすると値を出す', async () => {
    const screen = await render(<AdminUserScatter items={ITEMS} />)

    // SVG の点は locator に focus がないため、要素を取り出して直接あてる
    const dot = screen.getByLabelText('やまだ 回答 24 投票 12').element()
    ;(dot as SVGElement).focus()

    await expect
      .element(screen.getByText('やまだ · 回答 24 · 投票 12'))
      .toBeVisible()
  })
})
