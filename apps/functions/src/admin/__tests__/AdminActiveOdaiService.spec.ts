import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { InternalServerError } from '../../api/Error'
import { KotaePostgresRepositoryImpl } from '../../kotae/KotaePostgresRepositoryImpl'
import { OdaiPostgresRepositoryImpl } from '../../odai/OdaiPostgresRepositoryImpl'
import {
  ODAI_POSTING_ID,
  ODAI_VOTING_ID,
  TEAM_ID,
  seedOdai,
  seedVotingScenario,
} from '../../test/seeds'
import { clearDb, startDb, stopDb, testDb } from '../../test/setupDb'
import { VotePostgresRepositoryImpl } from '../../vote/VotePostgresRepositoryImpl'
import { AdminActiveOdaiServiceImpl } from '../AdminActiveOdaiService'

describe('AdminActiveOdaiServiceImpl', () => {
  let service: AdminActiveOdaiServiceImpl

  beforeAll(async () => {
    await startDb()
    service = new AdminActiveOdaiServiceImpl({
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

  it('アクティブなお題がない場合は active: false を返す', async () => {
    const result = await service.get({ slackTeamId: TEAM_ID })

    expect(result).toEqual({ active: false })
  })

  it('回答受付中のお題と件数を返す', async () => {
    await seedOdai(testDb, {
      createdAt: new Date('2025-01-01').toISOString(),
      dueDate: new Date('2025-01-31').toISOString(),
      id: ODAI_POSTING_ID,
      status: 'posting',
      title: '募集中お題',
    })

    const result = await service.get({ slackTeamId: TEAM_ID })

    expect(result).toEqual({
      active: true,
      odai: {
        createdAt: new Date('2025-01-01').getTime(),
        dueDate: new Date('2025-01-31').getTime(),
        id: ODAI_POSTING_ID,
        kotaeCount: 0,
        status: 'posting',
        title: '募集中お題',
        voteCount: 0,
      },
    })
  })

  it('投票中のお題と件数を返す', async () => {
    await seedVotingScenario(testDb)

    const result = await service.get({ slackTeamId: TEAM_ID })

    expect(result).toEqual({
      active: true,
      odai: {
        createdAt: new Date('2025-02-01').getTime(),
        dueDate: new Date('2025-02-28').getTime(),
        id: ODAI_VOTING_ID,
        kotaeCount: 3,
        status: 'voting',
        title: '投票中お題',
        voteCount: 4,
      },
    })
  })

  it('repository が取得に失敗した場合は共通エラーを返す', async () => {
    await seedVotingScenario(testDb)

    const failedService = new AdminActiveOdaiServiceImpl({
      kotaeRepository: {
        countByOdaiId: async () => null,
      },
      odaiRepository: new OdaiPostgresRepositoryImpl(testDb),
      voteRepository: new VotePostgresRepositoryImpl(testDb),
    })

    await expect(failedService.get({ slackTeamId: TEAM_ID })).resolves.toEqual(
      InternalServerError,
    )
  })
})
