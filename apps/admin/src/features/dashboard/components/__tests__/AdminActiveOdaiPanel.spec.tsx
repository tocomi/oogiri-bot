import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import {
  AdminActiveOdaiDetail,
  AdminActiveOdaiEmptyState,
  AdminActiveOdaiPanel,
  AdminActiveOdaiPanelSkeleton,
} from '../AdminActiveOdaiPanel'

const activeOdai = {
  createdAt: new Date('2025-02-01T09:00:00+09:00').getTime(),
  dueDate: new Date('2025-02-28T23:59:00+09:00').getTime(),
  id: 'odai-voting',
  kotaeCount: 3,
  status: 'voting' as const,
  title: '投票中お題',
  voteCount: 4,
}

describe('AdminActiveOdaiEmptyState', () => {
  test('アクティブなお題がない旨を表示する', async () => {
    const screen = await render(<AdminActiveOdaiEmptyState />)

    await expect.element(screen.getByLabelText('現在のお題')).toBeVisible()
    await expect
      .element(screen.getByText('現在アクティブなお題はありません。'))
      .toBeVisible()
  })
})

describe('AdminActiveOdaiDetail', () => {
  test('お題の内容と件数を表示する', async () => {
    const screen = await render(<AdminActiveOdaiDetail odai={activeOdai} />)

    await expect
      .element(screen.getByRole('heading', { level: 2 }))
      .toHaveTextContent('投票中お題')
    await expect.element(screen.getByText('投票中', { exact: true })).toBeVisible()
    await expect.element(screen.getByText('回答数')).toBeVisible()
    await expect.element(screen.getByText('投票数')).toBeVisible()

    const kotaeValue = screen
      .getByText('回答数')
      .element()
      .parentElement?.querySelector('dd')?.textContent
    const voteValue = screen
      .getByText('投票数')
      .element()
      .parentElement?.querySelector('dd')?.textContent

    expect(kotaeValue).toBe(String(activeOdai.kotaeCount))
    expect(voteValue).toBe(String(activeOdai.voteCount))
  })

  test('回答受付中のステータスラベルを表示する', async () => {
    const screen = await render(
      <AdminActiveOdaiDetail
        odai={{
          ...activeOdai,
          kotaeCount: 0,
          status: 'posting',
          title: '募集中お題',
          voteCount: 0,
        }}
      />,
    )

    await expect.element(screen.getByText('回答受付中')).toBeVisible()
    await expect
      .element(screen.getByRole('heading', { level: 2 }))
      .toHaveTextContent('募集中お題')
  })

  test('締切と作成日時を ISO 8601 の time 要素で表示する', async () => {
    const screen = await render(<AdminActiveOdaiDetail odai={activeOdai} />)

    const times = screen.getByRole('time').elements()
    expect(times).toHaveLength(2)
    expect(times[0]?.getAttribute('dateTime')).toBe(
      new Date(activeOdai.dueDate).toISOString(),
    )
    expect(times[1]?.getAttribute('dateTime')).toBe(
      new Date(activeOdai.createdAt).toISOString(),
    )
  })
})

describe('AdminActiveOdaiPanel', () => {
  test('active: false のとき空状態を表示する', async () => {
    const screen = await render(
      <AdminActiveOdaiPanel overview={{ active: false }} />,
    )

    await expect
      .element(screen.getByText('現在アクティブなお題はありません。'))
      .toBeVisible()
  })

  test('active: true のときお題詳細を表示する', async () => {
    const screen = await render(
      <AdminActiveOdaiPanel overview={{ active: true, odai: activeOdai }} />,
    )

    await expect.element(screen.getByText('投票中お題')).toBeVisible()
    await expect.element(screen.getByText('投票中', { exact: true })).toBeVisible()
  })
})

describe('AdminActiveOdaiPanelSkeleton', () => {
  test('読み込み中の現在のお題パネルを表示する', async () => {
    const screen = await render(<AdminActiveOdaiPanelSkeleton />)

    await expect
      .element(screen.getByLabelText('現在のお題を読み込み中'))
      .toHaveAttribute('aria-busy', 'true')
    await expect.element(screen.getByText('現在のお題')).toBeVisible()
  })
})
