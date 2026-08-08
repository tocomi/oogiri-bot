import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import type { AdminOdaiListItem } from '@/features/reporting/api/adminReporting'

import { AdminOdaiTable } from '../AdminOdaiTable'

const createItem = (
  overrides: Partial<AdminOdaiListItem> = {},
): AdminOdaiListItem => ({
  id: 'odai-1',
  title: '発表済みのお題',
  status: 'finished',
  dueDate: new Date('2026-08-02T09:00:00Z').getTime(),
  createdAt: new Date('2026-07-28T01:00:00Z').getTime(),
  publishedAt: new Date('2026-08-02T09:00:00Z').getTime(),
  kotaeCount: 51,
  kotaeUserCount: 31,
  voteCount: 102,
  voteUserCount: 34,
  ...overrides,
})

describe('AdminOdaiTable', () => {
  test('お題がなければその旨を表示する', async () => {
    const screen = await render(
      <AdminOdaiTable items={[]} selectedOdaiId={null} period="2026" />,
    )

    await expect
      .element(screen.getByText('この期間に作られたお題はありません。'))
      .toBeVisible()
  })

  test('集計値を表示する', async () => {
    const screen = await render(
      <AdminOdaiTable
        items={[createItem()]}
        selectedOdaiId={null}
        period="2026"
      />,
    )

    await expect.element(screen.getByText('51', { exact: true })).toBeVisible()
    await expect.element(screen.getByText('102', { exact: true })).toBeVisible()
    await expect.element(screen.getByText('31', { exact: true })).toBeVisible()
    await expect.element(screen.getByText('34', { exact: true })).toBeVisible()
  })

  test('未発表のお題は発表日を伏せる', async () => {
    const screen = await render(
      <AdminOdaiTable
        items={[
          createItem({
            id: 'odai-voting',
            title: '締切前のお題',
            status: 'voting',
            publishedAt: null,
          }),
        ]}
        selectedOdaiId={null}
        period="2026"
      />,
    )

    await expect
      .element(screen.getByText('投票中', { exact: true }))
      .toBeVisible()
    expect(await screen.getByText('—').all()).toHaveLength(1)
  })

  test('期間と ID を引き継ぐリンクを張る', async () => {
    const screen = await render(
      <AdminOdaiTable
        items={[createItem()]}
        selectedOdaiId={null}
        period="2025"
      />,
    )

    await expect
      .element(screen.getByRole('link', { name: '発表済みのお題' }))
      .toHaveAttribute('href', '/?period=2025&odaiId=odai-1')
  })
})
