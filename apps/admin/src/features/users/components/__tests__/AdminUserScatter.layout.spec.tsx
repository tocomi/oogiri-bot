import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import type { AdminUserStatsItem } from '@/features/users/api/adminUsers'

import { AdminUserScatter } from '../AdminUserScatter'

const items: AdminUserStatsItem[] = Array.from({ length: 12 }, (_, index) => ({
  userId: `U${index}`,
  name: `ユーザー ${index}`,
  kotaeCount: 42 - index * 3,
  voteCount: 45 - index * 2,
  postedOdaiCount: 8 - (index % 4),
  kotaeOdaiCount: 15 - index,
  voteOdaiCount: 15 - index,
}))

/**
 * 与えた幅に散布図を収め、実際に描かれる大きさを測る
 */
const renderAtWidth = async (width: number) => {
  await render(
    <div style={{ width: `${width}px` }}>
      <AdminUserScatter items={items} />
    </div>,
  )

  const svg = document.querySelector('svg')
  if (!svg) throw new Error('scatter should be rendered')

  return svg.getBoundingClientRect()
}

describe('AdminUserScatter のレイアウト', () => {
  // 一覧の上に置く図なので、縦を占有しすぎない縮尺に保つ
  for (const width of [768, 1024, 1280]) {
    test(`幅 ${width}px では高さが幅の 25% を超えない`, async () => {
      const { width: drawn, height } = await renderAtWidth(width)

      expect(height).toBeLessThanOrEqual(drawn * 0.25)
    })
  }

  test('ページごと横に伸びない', async () => {
    await renderAtWidth(390)

    const root = document.documentElement
    expect(root.scrollWidth).toBe(root.clientWidth)
  })
})
