import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { hasError, InternalServerError } from '../../api/Error'
import {
  OTHER_TEAM_ID,
  SUMMARY_PERIOD,
  TEAM_ID,
  seedSummaryScenario,
} from '../../test/seeds'
import {
  clearDb,
  recordQueries,
  startDb,
  stopDb,
  summarizeQueries,
  testDb,
} from '../../test/setupDb'
import { AdminOdaiListServiceImpl } from '../AdminOdaiListService'
import { AdminReportingPostgresRepositoryImpl } from '../AdminReportingPostgresRepositoryImpl'

describe('AdminOdaiListServiceImpl', () => {
  let service: AdminOdaiListServiceImpl

  beforeAll(async () => {
    await startDb()
    service = new AdminOdaiListServiceImpl({
      reportingRepository: new AdminReportingPostgresRepositoryImpl(testDb),
    })
  })

  afterAll(async () => {
    await stopDb()
  })

  beforeEach(async () => {
    await clearDb()
  })

  it('対象期間のお題を新しい順に集計値つきで返す', async () => {
    await seedSummaryScenario(testDb)

    const result = await service.get({
      slackTeamId: TEAM_ID,
      limit: 20,
      ...SUMMARY_PERIOD,
    })
    if (hasError(result)) throw new Error('list should be returned')
    const { items } = result

    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({
      id: 'odai-cur-2',
      title: 'テストお題',
      status: 'posting',
      dueDate: new Date('2025-01-31').getTime(),
      createdAt: new Date('2025-02-10').getTime(),
      publishedAt: null,
      kotaeCount: 1,
      kotaeUserCount: 1,
      voteCount: 1,
      topPoint: null,
    })
    expect(items[1]).toEqual(
      expect.objectContaining({
        id: 'odai-cur-1',
        kotaeCount: 2,
        kotaeUserCount: 1,
        voteCount: 3,
      }),
    )
  })

  it('別チームのお題を含めない', async () => {
    await seedSummaryScenario(testDb)

    const result = await service.get({
      slackTeamId: OTHER_TEAM_ID,
      limit: 20,
      ...SUMMARY_PERIOD,
    })
    if (hasError(result)) throw new Error('list should be returned')
    const { items } = result

    expect(items.map((item) => item.id)).toEqual(['odai-other'])
  })

  it('limit を超えて返さない', async () => {
    await seedSummaryScenario(testDb)

    const result = await service.get({
      slackTeamId: TEAM_ID,
      limit: 1,
      ...SUMMARY_PERIOD,
    })
    if (hasError(result)) throw new Error('list should be returned')
    const { items } = result

    expect(items.map((item) => item.id)).toEqual(['odai-cur-2'])
  })

  it('該当するお題がなければ空配列を返す', async () => {
    const result = await service.get({
      slackTeamId: TEAM_ID,
      limit: 20,
      ...SUMMARY_PERIOD,
    })
    if (hasError(result)) throw new Error('list should be returned')
    const { items } = result

    expect(items).toEqual([])
  })

  it('取得に失敗した場合は共通エラーを返す', async () => {
    const failedService = new AdminOdaiListServiceImpl({
      reportingRepository: { getOdaiList: async () => ({ status: 'error' }) },
    })

    const result = await failedService.get({
      slackTeamId: TEAM_ID,
      limit: 20,
      ...SUMMARY_PERIOD,
    })

    expect(result).toEqual(InternalServerError)
  })

  it('お題の件数が増えても DB 往復回数は変わらない', async () => {
    await seedSummaryScenario(testDb)

    const { queries } = await recordQueries(() =>
      service.get({ slackTeamId: TEAM_ID, limit: 20, ...SUMMARY_PERIOD }),
    )

    expect(summarizeQueries(queries)).toEqual([
      'select Odai',
      'select Kotae',
      'select Vote',
      'select Result',
    ])
  })
})
