import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { AdminMetricCard, AdminMetricCardSkeleton } from '../AdminMetricCard'

describe('AdminMetricCard', () => {
  test('タイトルと値を表示する', async () => {
    const screen = await render(<AdminMetricCard title="お題の数" value={12} />)

    await expect
      .element(screen.getByRole('heading'))
      .toHaveTextContent('お題の数')
    await expect.element(screen.getByText('12')).toBeVisible()
  })

  test('読み込み中の表示をカードの形で表示する', async () => {
    const screen = await render(<AdminMetricCardSkeleton title="お題の数" />)

    await expect
      .element(screen.getByRole('heading'))
      .toHaveTextContent('お題の数')
    await expect.element(screen.getByRole('article')).toBeVisible()
  })
})
