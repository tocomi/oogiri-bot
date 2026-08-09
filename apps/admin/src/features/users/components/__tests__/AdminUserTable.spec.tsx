import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import type { AdminUserStatsItem } from '@/features/users/api/adminUsers'

import { AdminUserTable } from '../AdminUserTable'

const createSortHref = (sort: string) => `/users?period=2026&sort=${sort}`

const createItem = (
  overrides: Partial<AdminUserStatsItem> = {},
): AdminUserStatsItem => ({
  userId: 'U1',
  name: 'たなか',
  kotaeCount: 42,
  voteCount: 45,
  kotaeOdaiCount: 15,
  voteOdaiCount: 15,
  ...overrides,
})

describe('AdminUserTable', () => {
  test('参加者がいなければその旨を表示する', async () => {
    const screen = await render(
      <AdminUserTable
        items={[]}
        odaiCount={15}
        sort="kotae"
        createSortHref={createSortHref}
      />,
    )

    await expect
      .element(screen.getByText('この期間に回答・投票したユーザーはいません。'))
      .toBeVisible()
  })

  test('回答と投票の最大値を見出しに出す', async () => {
    const screen = await render(
      <AdminUserTable
        items={[
          createItem(),
          createItem({
            userId: 'U2',
            name: 'さとう',
            kotaeCount: 9,
            voteCount: 33,
          }),
        ]}
        odaiCount={15}
        sort="kotae"
        createSortHref={createSortHref}
      />,
    )

    await expect.element(screen.getByText('回答（最大 42）')).toBeVisible()
    await expect.element(screen.getByText('投票（最大 45）')).toBeVisible()
  })

  test('参加お題を期間内のお題数とあわせて表示する', async () => {
    const screen = await render(
      <AdminUserTable
        items={[createItem({ kotaeOdaiCount: 11 })]}
        odaiCount={15}
        sort="kotae"
        createSortHref={createSortHref}
      />,
    )

    await expect.element(screen.getByText('11 / 15')).toBeVisible()
  })

  test('表示名を引けないユーザーは ID を出す', async () => {
    const screen = await render(
      <AdminUserTable
        items={[createItem({ name: null, userId: 'U404' })]}
        odaiCount={15}
        sort="kotae"
        createSortHref={createSortHref}
      />,
    )

    await expect.element(screen.getByText('U404')).toBeVisible()
  })

  test('選択中の並びを見出しで示し、もう一方へのリンクを出す', async () => {
    const screen = await render(
      <AdminUserTable
        items={[createItem()]}
        odaiCount={15}
        sort="vote"
        createSortHref={createSortHref}
      />,
    )

    await expect
      .element(screen.getByRole('link', { name: /投票（最大 45）/ }))
      .toHaveAttribute('href', '/users?period=2026&sort=vote')
    await expect
      .element(screen.getByRole('link', { name: '回答（最大 42）' }))
      .toHaveAttribute('href', '/users?period=2026&sort=kotae')
  })

  test('回答していない人の比は記号で示す', async () => {
    const screen = await render(
      <AdminUserTable
        items={[
          createItem({ kotaeCount: 0, kotaeOdaiCount: 0, voteCount: 12 }),
        ]}
        odaiCount={15}
        sort="kotae"
        createSortHref={createSortHref}
      />,
    )

    await expect.element(screen.getByText('—')).toBeVisible()
  })
})
