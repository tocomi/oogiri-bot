import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import type { AdminSummary } from '@/features/reporting/api/adminReporting'

import { AdminSummaryTiles } from '../AdminSummaryTiles'

const counts = (
  overrides: Partial<AdminSummary['current']> = {},
): AdminSummary['current'] => ({
  odaiCount: 0,
  kotaeCount: 0,
  voteCount: 0,
  kotaeUserCount: 0,
  voteUserCount: 0,
  ...overrides,
})

const createSummary = (
  current: AdminSummary['current'],
  previous: AdminSummary['current'],
): AdminSummary => ({
  current,
  period: { from: 0, to: 1 },
  previous,
})

describe('AdminSummaryTiles', () => {
  test('集計値を 3 桁区切りで表示する', async () => {
    const screen = await render(
      <AdminSummaryTiles
        summary={createSummary(
          counts({ odaiCount: 13, kotaeCount: 508, voteCount: 1132 }),
          counts({ odaiCount: 13, kotaeCount: 508, voteCount: 1132 }),
        )}
      />,
    )

    await expect
      .element(screen.getByText('1,132', { exact: true }))
      .toBeVisible()
    await expect.element(screen.getByText('508', { exact: true })).toBeVisible()
  })

  test('比較できる前期がなければ「比較なし」と表示する', async () => {
    const screen = await render(
      <AdminSummaryTiles
        summary={{
          current: counts({ odaiCount: 128 }),
          period: { from: 0, to: 1 },
          previous: null,
        }}
      />,
    )

    expect(await screen.getByText('比較なし').all()).toHaveLength(5)
    expect(await screen.getByText(/前期比/).all()).toHaveLength(0)
  })

  test('前期比を増減した数そのもので表示する', async () => {
    const screen = await render(
      <AdminSummaryTiles
        summary={createSummary(
          counts({
            odaiCount: 13,
            kotaeCount: 100,
            voteCount: 50,
            kotaeUserCount: 7,
            voteUserCount: 9,
          }),
          counts({
            odaiCount: 11,
            kotaeCount: 120,
            voteCount: 50,
            kotaeUserCount: 3,
            voteUserCount: 4,
          }),
        )}
      />,
    )

    await expect.element(screen.getByText('+2 前期比')).toBeVisible()
    await expect.element(screen.getByText('-20 前期比')).toBeVisible()
    await expect.element(screen.getByText('±0 前期比')).toBeVisible()
    await expect.element(screen.getByText('+4 前期比')).toBeVisible()
    await expect.element(screen.getByText('+5 前期比')).toBeVisible()
  })
})
