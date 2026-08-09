import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { hasError, InternalServerError } from '../../api/Error'
import {
  OTHER_TEAM_ID,
  seedOdai,
  seedSummaryScenario,
  SUMMARY_PERIOD,
  TEAM_ID,
  USER_1,
  USER_2,
  USER_3,
  USER_4,
} from '../../test/seeds'
import {
  clearDb,
  recordQueries,
  startDb,
  stopDb,
  summarizeQueries,
  testDb,
} from '../../test/setupDb'
import { AdminReportingPostgresRepositoryImpl } from '../AdminReportingPostgresRepositoryImpl'
import { AdminUserNameResolver } from '../AdminUserNameResolver'
import { AdminUserStatsServiceImpl } from '../AdminUserStatsService'

/**
 * 表示名を固定で返す resolver
 * Slack への問い合わせを挟まず、集計と並び順そのものを検証するために使う
 */
const createNameResolver = (nameMap: {
  [userId: string]: string
}): AdminUserNameResolver => ({
  resolve: async (userIds) =>
    Object.fromEntries(
      userIds
        .filter((userId) => nameMap[userId])
        .map((userId) => [userId, nameMap[userId]]),
    ),
})

describe('AdminUserStatsServiceImpl', () => {
  let service: AdminUserStatsServiceImpl

  beforeAll(async () => {
    await startDb()
    service = new AdminUserStatsServiceImpl({
      reportingRepository: new AdminReportingPostgresRepositoryImpl(testDb),
      userNameResolver: createNameResolver({
        [USER_1]: 'たなか',
        [USER_2]: 'さとう',
        [USER_3]: 'すずき',
      }),
    })
  })

  afterAll(async () => {
    await stopDb()
  })

  beforeEach(async () => {
    await clearDb()
  })

  it('対象期間のユーザー別集計を回答数の多い順に返す', async () => {
    await seedSummaryScenario(testDb)

    const result = await service.get({
      slackTeamId: TEAM_ID,
      ...SUMMARY_PERIOD,
    })
    if (hasError(result)) throw new Error('stats should be returned')

    expect(result.odaiCount).toBe(2)
    expect(result.items).toEqual([
      {
        userId: USER_1,
        name: 'たなか',
        kotaeCount: 2,
        kotaeOdaiCount: 1,
        postedOdaiCount: 2,
        voteCount: 1,
        voteOdaiCount: 1,
      },
      {
        userId: USER_2,
        name: 'さとう',
        kotaeCount: 1,
        kotaeOdaiCount: 1,
        postedOdaiCount: 0,
        voteCount: 2,
        voteOdaiCount: 1,
      },
      {
        userId: USER_3,
        name: 'すずき',
        kotaeCount: 0,
        kotaeOdaiCount: 0,
        postedOdaiCount: 0,
        voteCount: 1,
        voteOdaiCount: 1,
      },
    ])
  })

  it('出題しかしていないユーザーも出題数つきで一覧に残す', async () => {
    await seedSummaryScenario(testDb)
    await seedOdai(testDb, {
      id: 'odai-cur-3',
      createdBy: USER_4,
      createdAt: new Date('2025-02-10').toISOString(),
    })

    const result = await service.get({
      slackTeamId: TEAM_ID,
      ...SUMMARY_PERIOD,
    })
    if (hasError(result)) throw new Error('stats should be returned')

    expect(result.odaiCount).toBe(3)
    expect(result.items).toContainEqual({
      userId: USER_4,
      name: null,
      kotaeCount: 0,
      kotaeOdaiCount: 0,
      postedOdaiCount: 1,
      voteCount: 0,
      voteOdaiCount: 0,
    })
  })

  it('期間外・別チームのお題は出題数に数えない', async () => {
    await seedSummaryScenario(testDb)

    const result = await service.get({
      slackTeamId: TEAM_ID,
      ...SUMMARY_PERIOD,
    })
    if (hasError(result)) throw new Error('stats should be returned')

    // 前期の odai-prev と別チームの odai-other も USER_1 の出題だが、対象期間の 2 件だけを数える
    expect(
      result.items.find((item) => item.userId === USER_1)?.postedOdaiCount,
    ).toBe(2)
  })

  it('別チームのユーザーを含めない', async () => {
    await seedSummaryScenario(testDb)

    const result = await service.get({
      slackTeamId: OTHER_TEAM_ID,
      ...SUMMARY_PERIOD,
    })
    if (hasError(result)) throw new Error('stats should be returned')

    expect(result.odaiCount).toBe(1)
    expect(result.items.map((item) => item.userId)).toEqual([USER_1, USER_3])
  })

  it('該当する参加者がいなければ空配列を返す', async () => {
    const result = await service.get({
      slackTeamId: TEAM_ID,
      ...SUMMARY_PERIOD,
    })
    if (hasError(result)) throw new Error('stats should be returned')

    expect(result).toEqual({ items: [], odaiCount: 0 })
  })

  it('表示名を引けないユーザーも名前なしで残す', async () => {
    await seedSummaryScenario(testDb)

    const anonymousService = new AdminUserStatsServiceImpl({
      reportingRepository: new AdminReportingPostgresRepositoryImpl(testDb),
      userNameResolver: createNameResolver({ [USER_1]: 'たなか' }),
    })

    const result = await anonymousService.get({
      slackTeamId: TEAM_ID,
      ...SUMMARY_PERIOD,
    })
    if (hasError(result)) throw new Error('stats should be returned')

    expect(result.items.map((item) => [item.userId, item.name])).toEqual([
      [USER_1, 'たなか'],
      [USER_2, null],
      [USER_3, null],
    ])
  })

  it('取得に失敗した場合は共通エラーを返す', async () => {
    const failedService = new AdminUserStatsServiceImpl({
      reportingRepository: { getUserStats: async () => ({ status: 'error' }) },
      userNameResolver: createNameResolver({}),
    })

    const result = await failedService.get({
      slackTeamId: TEAM_ID,
      ...SUMMARY_PERIOD,
    })

    expect(result).toEqual(InternalServerError)
  })

  it('ユーザーの人数が増えても DB 往復回数は変わらない', async () => {
    await seedSummaryScenario(testDb)

    const { queries } = await recordQueries(() =>
      service.get({ slackTeamId: TEAM_ID, ...SUMMARY_PERIOD }),
    )

    expect(summarizeQueries(queries)).toEqual([
      'select Odai',
      'select Kotae',
      'select Vote',
    ])
  })
})
