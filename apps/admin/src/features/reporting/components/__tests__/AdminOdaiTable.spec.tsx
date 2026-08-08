import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { AdminOdaiListItem } from '@/features/reporting/api/adminReporting'

import type { AdminOpenOdai } from '../AdminOdaiSelection'

import { AdminOdaiSelectionProvider } from '../AdminOdaiSelection'
import { AdminOdaiTable } from '../AdminOdaiTable'

const push = vi.fn()

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push }),
}))

/**
 * 一覧は選択状態を Provider から受け取るため、テストでも同じ形で包む
 * リンクをたどるとテストの iframe ごと遷移してしまうため、既定の遷移は止める
 */
const renderTable = (
  items: AdminOdaiListItem[],
  period: string,
  selectedOdai: AdminOpenOdai | null = null,
) =>
  render(
    <div onClickCapture={(event) => event.preventDefault()}>
      <AdminOdaiSelectionProvider selectedOdai={selectedOdai} closeHref="/">
        <AdminOdaiTable items={items} period={period} />
      </AdminOdaiSelectionProvider>
    </div>,
  )

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
    const screen = await renderTable([], '2026')

    await expect
      .element(screen.getByText('この期間に作られたお題はありません。'))
      .toBeVisible()
  })

  test('集計値を表示する', async () => {
    const screen = await renderTable([createItem()], '2026')

    await expect.element(screen.getByText('51', { exact: true })).toBeVisible()
    await expect.element(screen.getByText('102', { exact: true })).toBeVisible()
    await expect.element(screen.getByText('31', { exact: true })).toBeVisible()
    await expect.element(screen.getByText('34', { exact: true })).toBeVisible()
  })

  test('未発表のお題は発表日を伏せる', async () => {
    const screen = await renderTable(
      [
        createItem({
          id: 'odai-voting',
          title: '締切前のお題',
          status: 'voting',
          publishedAt: null,
        }),
      ],
      '2026',
    )

    await expect
      .element(screen.getByText('投票中', { exact: true }))
      .toBeVisible()
    expect(await screen.getByText('—').all()).toHaveLength(1)
  })

  test('期間と ID を引き継ぐリンクを張る', async () => {
    const screen = await renderTable([createItem()], '2025')

    await expect
      .element(screen.getByRole('link', { name: '発表済みのお題' }))
      .toHaveAttribute('href', '/?period=2025&odaiId=odai-1')
  })

  test('選択中のお題の行に印を付ける', async () => {
    const screen = await renderTable([createItem()], '2026', {
      id: 'odai-1',
      title: '発表済みのお題',
    })

    await expect
      .element(screen.getByRole('row', { name: /発表済みのお題/ }))
      .toHaveAttribute('data-state', 'selected')
  })

  test('行を押した時点で遷移を待たずに選択状態にする', async () => {
    const screen = await renderTable([createItem()], '2026')

    await screen.getByRole('link', { name: '発表済みのお題' }).click()

    // URL 側はまだ未選択のままでも、押した行が選ばれている
    await expect
      .element(screen.getByRole('row', { name: /発表済みのお題/ }))
      .toHaveAttribute('data-state', 'selected')
  })
})
