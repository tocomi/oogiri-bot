import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { hasError, InternalServerError } from '../../api/Error'
import { OTHER_TEAM_ID, TEAM_ID, seedOdai } from '../../test/seeds'
import { clearDb, startDb, stopDb, testDb } from '../../test/setupDb'
import { AdminAvailableYearsServiceImpl } from '../AdminAvailableYearsService'
import { AdminReportingPostgresRepositoryImpl } from '../AdminReportingPostgresRepositoryImpl'

describe('AdminAvailableYearsServiceImpl', () => {
  let service: AdminAvailableYearsServiceImpl

  beforeAll(async () => {
    await startDb()
    service = new AdminAvailableYearsServiceImpl({
      reportingRepository: new AdminReportingPostgresRepositoryImpl(testDb),
    })
  })

  afterAll(async () => {
    await stopDb()
  })

  beforeEach(async () => {
    await clearDb()
  })

  it('お題がある年だけを新しい順に返す', async () => {
    await seedOdai(testDb, {
      id: 'odai-2024',
      createdAt: '2024-06-01T00:00:00.000Z',
    })
    await seedOdai(testDb, {
      id: 'odai-2026-1',
      createdAt: '2026-03-01T00:00:00.000Z',
    })
    await seedOdai(testDb, {
      id: 'odai-2026-2',
      createdAt: '2026-04-01T00:00:00.000Z',
    })

    const result = await service.get({ slackTeamId: TEAM_ID })
    if (hasError(result)) throw new Error('years should be returned')

    expect(result.years).toEqual([2026, 2024])
  })

  it('年の区切りを日本時間で判定する', async () => {
    // UTC では 2024 年だが、日本時間では 2025-01-01 00:00
    await seedOdai(testDb, {
      id: 'odai-jst-boundary',
      createdAt: '2024-12-31T15:00:00.000Z',
    })

    const result = await service.get({ slackTeamId: TEAM_ID })
    if (hasError(result)) throw new Error('years should be returned')

    expect(result.years).toEqual([2025])
  })

  it('別チームのお題を含めない', async () => {
    await seedOdai(testDb, {
      id: 'odai-other',
      teamId: OTHER_TEAM_ID,
      createdAt: '2024-06-01T00:00:00.000Z',
    })

    const result = await service.get({ slackTeamId: TEAM_ID })
    if (hasError(result)) throw new Error('years should be returned')

    expect(result.years).toEqual([])
  })

  it('取得に失敗した場合は共通エラーを返す', async () => {
    const failedService = new AdminAvailableYearsServiceImpl({
      reportingRepository: {
        getAvailableYears: async () => ({ status: 'error' }),
      },
    })

    const result = await failedService.get({ slackTeamId: TEAM_ID })

    expect(result).toEqual(InternalServerError)
  })
})
