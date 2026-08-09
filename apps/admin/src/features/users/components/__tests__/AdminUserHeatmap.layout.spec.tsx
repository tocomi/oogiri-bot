import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import type { AdminHeatRow } from '../AdminUserHeatmap'

import { AdminUserHeatmap } from '../AdminUserHeatmap'

const ODAI_LIST = Array.from({ length: 30 }, (_, index) => ({
  id: `odai-${index}`,
  title: `深夜のオフィスで見かけた、信じられない光景 ${index}`,
  createdAt: Date.parse('2026-01-05T00:00:00Z') + index * 86_400_000,
}))

const createRow = (
  userId: string,
  name: string,
  count: number,
): AdminHeatRow => ({
  userId,
  name,
  kotaeCounts: ODAI_LIST.map(() => count),
  voteCounts: ODAI_LIST.map(() => count),
})

const ROWS = [
  createRow('U1', 'とても長い表示名のユーザーさん', 3),
  createRow('U2', '短い', 2),
]

/**
 * 与えた幅にヒートマップを収め、名前の列を測る
 */
const renderAtWidth = async (width: number) => {
  await render(
    <div style={{ width: `${width}px` }}>
      <AdminUserHeatmap
        odaiList={ODAI_LIST}
        totalOdaiCount={ODAI_LIST.length}
        rows={ROWS}
      />
    </div>,
  )

  const names = Array.from(
    document.querySelectorAll('th[scope="row"] > span'),
  ) as HTMLElement[]

  return names
}

describe('AdminUserHeatmap のレイアウト', () => {
  test('名前の長さによらず列幅が揃う', async () => {
    const names = await renderAtWidth(1024)

    const widths = new Set(names.map((name) => name.clientWidth))
    expect(widths.size).toBe(1)
  })

  test('収まらない名前は省略する', async () => {
    const names = await renderAtWidth(1024)

    const long = names[0]
    // はみ出した分は切られ、枠自体は広がらない
    expect(long.scrollWidth).toBeGreaterThan(long.clientWidth)
  })

  test('列が多くてもページごと横に伸びない', async () => {
    await renderAtWidth(390)

    const root = document.documentElement
    expect(root.scrollWidth).toBe(root.clientWidth)
  })
})
