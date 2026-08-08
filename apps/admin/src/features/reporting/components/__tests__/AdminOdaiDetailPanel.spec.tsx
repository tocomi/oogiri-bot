import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import type { AdminOdaiDetail } from '@/features/reporting/api/adminReporting'

import { AdminOdaiDetailPanel } from '../AdminOdaiDetailPanel'

const createDetail = (
  overrides: Partial<AdminOdaiDetail> = {},
): AdminOdaiDetail => ({
  id: 'odai-1',
  title: '深夜のオフィスで見かけた、信じられない光景',
  status: 'finished',
  dueDate: new Date('2026-08-02T09:00:00Z').getTime(),
  createdAt: new Date('2026-07-28T01:00:00Z').getTime(),
  publishedAt: new Date('2026-08-02T09:00:00Z').getTime(),
  kotaeCount: 51,
  kotaeUserCount: 31,
  voteCount: 102,
  voteUserCount: 12,
  pointRanking: [
    {
      kotaeId: 'kotae-1',
      content: 'コピー機の前で正座している人がいた',
      rank: 1,
      point: 34,
      authorName: '田中 陽介',
    },
  ],
  countRanking: [],
  voteDistribution: { top3: 47, rank4to10: 34, rest: 21 },
  ...overrides,
})

describe('AdminOdaiDetailPanel', () => {
  test('発表済みは回答者の名前を表示する', async () => {
    const screen = await render(
      <AdminOdaiDetailPanel detail={createDetail()} />,
    )

    await expect
      .element(screen.getByText('コピー機の前で正座している人がいた'))
      .toBeVisible()
    await expect.element(screen.getByText('田中 陽介')).toBeVisible()
  })

  test('表示名が長くても領域を広げず、回答の幅を確保する', async () => {
    const longName = 'tsune / Kenta TSUNEMI / 10(月)-12(水) やすみ'
    const screen = await render(
      <div style={{ width: '520px' }}>
        <AdminOdaiDetailPanel
          detail={createDetail({
            pointRanking: [
              {
                kotaeId: 'kotae-1',
                content:
                  '性格はグループステージ敗退だけど、見た目はベスト4クラスだね。付き合ってください',
                rank: 1,
                point: 34,
                authorName: longName,
              },
            ],
          })}
        />
      </div>,
    )

    const name = screen.getByText(longName).element()
    // w-20 = 80px に収まり、はみ出した分は省略される
    expect(name.clientWidth).toBe(80)
    expect(name.scrollWidth).toBeGreaterThan(name.clientWidth)
  })

  test('発表前は名前を出さず、暫定である旨を添える', async () => {
    const screen = await render(
      <AdminOdaiDetailPanel
        detail={createDetail({
          status: 'voting',
          publishedAt: null,
          pointRanking: [
            {
              kotaeId: 'kotae-1',
              content: '上司の機嫌を予測して、先回りで謝っておく',
              rank: 1,
              point: 31,
              authorName: null,
            },
          ],
        })}
      />,
    )

    await expect
      .element(screen.getByText('上司の機嫌を予測して、先回りで謝っておく'))
      .toBeVisible()
    await expect
      .element(screen.getByText('順位は締切時点の暫定です。'))
      .toBeVisible()
    expect(await screen.getByText('田中 陽介').all()).toHaveLength(0)
  })

  test('票の散らばりを票数で表示する', async () => {
    const screen = await render(
      <AdminOdaiDetailPanel detail={createDetail()} />,
    )

    await expect.element(screen.getByText('47 票')).toBeVisible()
    await expect.element(screen.getByText('34 票')).toBeVisible()
    await expect.element(screen.getByText('21 票')).toBeVisible()
  })

  test('集計値を表示する', async () => {
    const screen = await render(
      <AdminOdaiDetailPanel detail={createDetail()} />,
    )

    await expect.element(screen.getByText('投票者')).toBeVisible()
    await expect.element(screen.getByText('12', { exact: true })).toBeVisible()
  })
})
