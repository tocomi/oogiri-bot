import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { InternalServerError } from '../../api/Error'
import { KotaePostgresRepositoryImpl } from '../../kotae/KotaePostgresRepositoryImpl'
import { OdaiPostgresRepositoryImpl } from '../../odai/OdaiPostgresRepositoryImpl'
import {
  OTHER_TEAM_ID,
  TEAM_ID,
  seedDashboardMetricsScenario,
} from '../../test/seeds'
import { clearDb, startDb, stopDb, testDb } from '../../test/setupDb'
import { VotePostgresRepositoryImpl } from '../../vote/VotePostgresRepositoryImpl'
import { AdminDashboardMetricsServiceImpl } from '../AdminDashboardMetricsService'

describe('AdminDashboardMetricsServiceImpl', () => {
  let service: AdminDashboardMetricsServiceImpl

  beforeAll(async () => {
    await startDb()
    service = new AdminDashboardMetricsServiceImpl({
      kotaeRepository: new KotaePostgresRepositoryImpl(testDb),
      odaiRepository: new OdaiPostgresRepositoryImpl(testDb),
      voteRepository: new VotePostgresRepositoryImpl(testDb),
    })
  })

  afterAll(async () => {
    await stopDb()
  })

  beforeEach(async () => {
    await clearDb()
  })

  it('指定した Slack チームの集計値だけを返す', async () => {
    await seedDashboardMetricsScenario(testDb)

    const result = await service.get({ slackTeamId: TEAM_ID })

    expect(result).toEqual({
      kotaeCount: 3,
      odaiCount: 2,
      voteCount: 2,
    })
  })

  it('別チームの集計値だけを返す', async () => {
    await seedDashboardMetricsScenario(testDb)

    const result = await service.get({ slackTeamId: OTHER_TEAM_ID })

    expect(result).toEqual({
      kotaeCount: 1,
      odaiCount: 1,
      voteCount: 1,
    })
  })

  it('repository が取得に失敗した場合は共通エラーを返す', async () => {
    const failedService = new AdminDashboardMetricsServiceImpl({
      kotaeRepository: new KotaePostgresRepositoryImpl(testDb),
      odaiRepository: {
        countAll: async () => null,
      },
      voteRepository: new VotePostgresRepositoryImpl(testDb),
    })

    await expect(failedService.get({ slackTeamId: TEAM_ID })).resolves.toEqual(
      InternalServerError,
    )
  })
})
