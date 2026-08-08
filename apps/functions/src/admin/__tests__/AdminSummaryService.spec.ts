import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { InternalServerError } from '../../api/Error'
import {
  OTHER_TEAM_ID,
  SUMMARY_PERIOD,
  TEAM_ID,
  seedSummaryScenario,
} from '../../test/seeds'
import { clearDb, startDb, stopDb, testDb } from '../../test/setupDb'
import { AdminReportingPostgresRepositoryImpl } from '../AdminReportingPostgresRepositoryImpl'
import { AdminSummaryServiceImpl } from '../AdminSummaryService'

describe('AdminSummaryServiceImpl', () => {
  let service: AdminSummaryServiceImpl

  beforeAll(async () => {
    await startDb()
    service = new AdminSummaryServiceImpl({
      reportingRepository: new AdminReportingPostgresRepositoryImpl(testDb),
    })
  })

  afterAll(async () => {
    await stopDb()
  })

  beforeEach(async () => {
    await clearDb()
  })

  it('対象期間の集計値を返す', async () => {
    await seedSummaryScenario(testDb)

    const result = await service.get({
      slackTeamId: TEAM_ID,
      ...SUMMARY_PERIOD,
    })

    expect(result).toEqual({
      current: {
        kotaeCount: 3,
        kotaeUserCount: 2,
        odaiCount: 2,
        voteCount: 4,
        voteUserCount: 3,
      },
      period: SUMMARY_PERIOD,
      previous: {
        kotaeCount: 1,
        kotaeUserCount: 1,
        odaiCount: 1,
        voteCount: 1,
        voteUserCount: 1,
      },
    })
  })

  it('別チームのデータを対象期間に含めない', async () => {
    await seedSummaryScenario(testDb)

    const result = await service.get({
      slackTeamId: OTHER_TEAM_ID,
      ...SUMMARY_PERIOD,
    })

    expect(result).toEqual({
      current: {
        kotaeCount: 1,
        kotaeUserCount: 1,
        odaiCount: 1,
        voteCount: 1,
        voteUserCount: 1,
      },
      period: SUMMARY_PERIOD,
      previous: {
        kotaeCount: 0,
        kotaeUserCount: 0,
        odaiCount: 0,
        voteCount: 0,
        voteUserCount: 0,
      },
    })
  })

  it('期間の終端はその時刻を含めない', async () => {
    await seedSummaryScenario(testDb)

    const result = await service.get({
      slackTeamId: TEAM_ID,
      from: new Date('2025-01-01').getTime(),
      to: new Date('2025-02-10').getTime(),
    })

    expect(result).toEqual(
      expect.objectContaining({
        current: expect.objectContaining({ kotaeCount: 1, odaiCount: 1 }),
      }),
    )
  })

  it('全期間は比較できる前期がないため previous を null にする', async () => {
    await seedSummaryScenario(testDb)

    const result = await service.get({
      slackTeamId: TEAM_ID,
      from: 0,
      to: SUMMARY_PERIOD.to,
    })

    if ('status' in result) throw new Error('summary should be returned')

    expect(result.previous).toBeNull()
    expect(result.current.odaiCount).toBe(3)
  })

  it('repository が取得に失敗した場合は共通エラーを返す', async () => {
    const failedService = new AdminSummaryServiceImpl({
      reportingRepository: {
        getSummaryCounts: async () => ({ status: 'error' }),
      },
    })

    const result = await failedService.get({
      slackTeamId: TEAM_ID,
      ...SUMMARY_PERIOD,
    })

    expect(result).toEqual(InternalServerError)
  })
})
