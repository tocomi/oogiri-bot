import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ADMIN_ALL_PERIOD } from '@/features/shared/lib/adminPeriod'

import { AdminPeriodSelector } from '../AdminPeriodSelector'

const push = vi.fn()

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push }),
}))

const AVAILABLE_YEARS = [2026, 2025, 2024]

describe('AdminPeriodSelector', () => {
  test('選択中の年をトリガーに表示する', async () => {
    const screen = await render(
      <AdminPeriodSelector
        current={2025}
        availableYears={AVAILABLE_YEARS}
        basePath="/"
      />,
    )

    await expect
      .element(screen.getByLabelText('年'))
      .toHaveTextContent('2025 年')
  })

  test('全期間を選んでいるときは年を未選択にする', async () => {
    const screen = await render(
      <AdminPeriodSelector
        current={ADMIN_ALL_PERIOD}
        availableYears={AVAILABLE_YEARS}
        basePath="/"
      />,
    )

    await expect
      .element(screen.getByLabelText('年'))
      .toHaveTextContent('年を選ぶ')
    await expect
      .element(screen.getByRole('link', { name: '全期間' }))
      .toHaveAttribute('aria-current', 'page')
  })

  test('年を選ぶとその年の URL に移動する', async () => {
    push.mockClear()
    const screen = await render(
      <AdminPeriodSelector
        current={2026}
        availableYears={AVAILABLE_YEARS}
        basePath="/"
      />,
    )

    await screen.getByLabelText('年').click()
    await screen.getByRole('option', { name: '2024 年' }).click()

    expect(push).toHaveBeenCalledWith('/?period=2024')
  })

  test('basePath を渡すとその画面に留まったまま期間を切り替える', async () => {
    push.mockClear()
    const screen = await render(
      <AdminPeriodSelector
        current={2026}
        availableYears={AVAILABLE_YEARS}
        basePath="/users"
      />,
    )

    await expect
      .element(screen.getByRole('link', { name: '全期間' }))
      .toHaveAttribute('href', '/users?period=all')

    await screen.getByLabelText('年').click()
    await screen.getByRole('option', { name: '2024 年' }).click()

    expect(push).toHaveBeenCalledWith('/users?period=2024')
  })

  test('選べる年がなければ年の選択を無効にする', async () => {
    const screen = await render(
      <AdminPeriodSelector
        current={ADMIN_ALL_PERIOD}
        availableYears={[]}
        basePath="/"
      />,
    )

    await expect.element(screen.getByLabelText('年')).toBeDisabled()
  })
})
