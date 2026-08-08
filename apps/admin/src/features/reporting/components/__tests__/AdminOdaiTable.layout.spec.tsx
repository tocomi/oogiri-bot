import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import type { AdminOdaiListItem } from '@/features/reporting/api/adminReporting'

import { AdminOdaiTable } from '../AdminOdaiTable'

const items: AdminOdaiListItem[] = Array.from({ length: 12 }, (_, index) => ({
  id: `odai-${index}`,
  title: `深夜のオフィスで見かけた、信じられない光景 ${index}`,
  status: 'finished' as const,
  dueDate: Date.parse('2026-08-02T09:00:00Z'),
  createdAt: Date.parse('2026-07-28T01:00:00Z') - index * 86_400_000,
  publishedAt: Date.parse('2026-08-02T09:00:00Z'),
  kotaeCount: 51,
  kotaeUserCount: 31,
  voteCount: 102,
  voteUserCount: 34,
}))

/**
 * 与えた幅にテーブルを収め、内側で横スクロールが必要かどうかを測る
 */
const renderAtWidth = async (width: number) => {
  await render(
    <div style={{ width: `${width}px` }}>
      <AdminOdaiTable items={items} selectedOdaiId={null} period="90d" />
    </div>,
  )

  const container = document.querySelector('[data-slot="table-container"]')
  if (!container) throw new Error('table container should exist')

  return { client: container.clientWidth, scroll: container.scrollWidth }
}

describe('AdminOdaiTable のレイアウト', () => {
  // ドロワー化で一覧が画面幅を独占するため、通常の PC 幅では横スクロールが出ない
  for (const width of [768, 1024, 1280]) {
    test(`幅 ${width}px では横スクロールが出ない`, async () => {
      const { client, scroll } = await renderAtWidth(width)

      expect(scroll).toBe(client)
    })
  }

  test('狭い幅ではテーブルの内側だけがスクロールする', async () => {
    const { client, scroll } = await renderAtWidth(390)

    expect(scroll).toBeGreaterThan(client)
    // ページごと横に伸びていないこと
    const root = document.documentElement
    expect(root.scrollWidth).toBe(root.clientWidth)
  })
})
