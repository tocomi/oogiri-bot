import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import type { AdminHeatRow } from '../AdminUserHeatmap'

import { AdminUserHeatmap } from '../AdminUserHeatmap'

const ODAI_LIST = [
  {
    id: 'odai-1',
    title: '古いお題',
    createdAt: new Date('2026-01-05').getTime(),
  },
  {
    id: 'odai-2',
    title: '新しいお題',
    createdAt: new Date('2026-02-05').getTime(),
  },
]

/**
 * 面ごとに顔ぶれが変わる母集団
 * さとうは回答なし・投票あり、すずきは回答あり・投票なし
 */
const ROWS: AdminHeatRow[] = [
  {
    userId: 'U1',
    name: 'たなか',
    kotaeCounts: [3, 2],
    voteCounts: [3, 0],
  },
  {
    userId: 'U2',
    name: 'さとう',
    kotaeCounts: [0, 0],
    voteCounts: [1, 2],
  },
  {
    userId: 'U3',
    name: 'すずき',
    kotaeCounts: [1, 0],
    voteCounts: [0, 0],
  },
]

describe('AdminUserHeatmap', () => {
  test('お題がなければその旨を表示する', async () => {
    const screen = await render(
      <AdminUserHeatmap odaiList={[]} totalOdaiCount={0} rows={[]} />,
    )

    await expect
      .element(screen.getByText('この期間に集計できるお題がありません。'))
      .toBeVisible()
  })

  test('面ごとに件数の多い順で並べ、0 件の人は出さない', async () => {
    const screen = await render(
      <AdminUserHeatmap odaiList={ODAI_LIST} totalOdaiCount={2} rows={ROWS} />,
    )

    // 先に回答の面、次に投票の面が並ぶ
    // 回答: たなか 5 / すずき 1（さとうは 0 なので出さない）
    // 投票: たなか 3 / さとう 3（同数は userId 順、すずきは 0 なので出さない）
    await expect
      .element(screen.getByRole('rowheader').first())
      .toHaveTextContent('たなか')

    const names = screen
      .getByRole('rowheader')
      .elements()
      .map((element) => element.textContent)

    expect(names).toEqual(['たなか', 'すずき', 'たなか', 'さとう'])
  })

  test('行ごとの合計を出す', async () => {
    const screen = await render(
      <AdminUserHeatmap odaiList={ODAI_LIST} totalOdaiCount={2} rows={ROWS} />,
    )

    // 回答面のたなかは 3 + 2
    await expect.element(screen.getByText('5')).toBeVisible()
  })

  test('その面で誰も参加していなければその旨を表示する', async () => {
    const screen = await render(
      <AdminUserHeatmap
        odaiList={ODAI_LIST}
        totalOdaiCount={2}
        rows={[
          {
            userId: 'U1',
            name: 'たなか',
            kotaeCounts: [3, 2],
            voteCounts: [0, 0],
          },
        ]}
      />,
    )

    await expect
      .element(screen.getByText('この期間に投票した人はいません。'))
      .toBeVisible()
  })

  test('列を絞ったときは絞る前の総数も示す', async () => {
    const screen = await render(
      <AdminUserHeatmap odaiList={ODAI_LIST} totalOdaiCount={47} rows={ROWS} />,
    )

    await expect.element(screen.getByText('全 47 件中 直近 2 件')).toBeVisible()
  })

  test('列を絞っていないときは総数を出さない', async () => {
    const screen = await render(
      <AdminUserHeatmap odaiList={ODAI_LIST} totalOdaiCount={2} rows={ROWS} />,
    )

    await expect.element(screen.getByText(/件中 直近/)).not.toBeInTheDocument()
  })

  test('参加していないお題も枠として並べる', async () => {
    const screen = await render(
      <AdminUserHeatmap odaiList={ODAI_LIST} totalOdaiCount={2} rows={ROWS} />,
    )

    // すずきは新しいお題に回答していないが、列は空のセルとして残る
    await expect
      .element(screen.getByTitle('すずき · 新しいお題 · 0 回答'))
      .toBeInTheDocument()
  })
})
