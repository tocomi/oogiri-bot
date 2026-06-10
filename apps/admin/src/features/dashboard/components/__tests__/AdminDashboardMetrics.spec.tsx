import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { AdminDashboardMetricsSkeleton } from '../AdminDashboardMetrics'

describe('AdminDashboardMetricsSkeleton', () => {
  test('読み込み中の集計カードを表示する', async () => {
    const screen = await render(<AdminDashboardMetricsSkeleton />)

    await expect
      .element(screen.getByLabelText('管理画面の集計値を読み込み中'))
      .toHaveAttribute('aria-busy', 'true')
    await expect.element(screen.getByText('お題の数')).toBeVisible()
    await expect.element(screen.getByText('答えの数')).toBeVisible()
    await expect.element(screen.getByText('投票の数')).toBeVisible()
  })
})
