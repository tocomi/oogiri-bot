import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  hasError,
  InternalServerError,
  NoTargetOdaiError,
} from '../../api/Error'
import { odai } from '../../db/schema'
import {
  KOTAE_1_ID,
  KOTAE_2_ID,
  ODAI_FINISHED_2_ID,
  ODAI_VOTING_ID,
  OTHER_TEAM_ID,
  TEAM_ID,
  USER_1,
  USER_2,
  seedFinishedScenario,
  seedVotingScenario,
} from '../../test/seeds'
import { clearDb, startDb, stopDb, testDb } from '../../test/setupDb'
import { AdminOdaiDetailServiceImpl } from '../AdminOdaiDetailService'
import { AdminReportingPostgresRepositoryImpl } from '../AdminReportingPostgresRepositoryImpl'
import { AdminUserNameResolver } from '../AdminUserNameResolver'

/** Slack を叩かずに表示名を解決する */
const createResolver = (names: {
  [userId: string]: string
}): AdminUserNameResolver & { calledWith: string[][] } => {
  const calledWith: string[][] = []
  return {
    calledWith,
    resolve: async (userIds) => {
      calledWith.push(userIds)
      return Object.fromEntries(
        userIds.map((userId) => [userId, names[userId] ?? 'unknown']),
      )
    },
  }
}

const createService = (resolver: AdminUserNameResolver) =>
  new AdminOdaiDetailServiceImpl({
    reportingRepository: new AdminReportingPostgresRepositoryImpl(testDb),
    userNameResolver: resolver,
  })

describe('AdminOdaiDetailServiceImpl', () => {
  beforeAll(async () => {
    await startDb()
  })

  afterAll(async () => {
    await stopDb()
  })

  beforeEach(async () => {
    await clearDb()
  })

  it('存在しないお題はエラーを返す', async () => {
    const result = await createService(createResolver({})).get({
      odaiId: 'missing',
      slackTeamId: TEAM_ID,
    })

    expect(result).toEqual(NoTargetOdaiError)
  })

  it('取得に失敗した場合は「お題なし」ではなく共通エラーを返す', async () => {
    const failedService = new AdminOdaiDetailServiceImpl({
      reportingRepository: {
        getOdaiDetailSource: async () => ({ status: 'error' }),
      },
      userNameResolver: createResolver({}),
    })

    const result = await failedService.get({
      odaiId: ODAI_VOTING_ID,
      slackTeamId: TEAM_ID,
    })

    expect(result).toEqual(InternalServerError)
  })

  it('別チームのお題は取得できない', async () => {
    await seedVotingScenario(testDb)

    const result = await createService(createResolver({})).get({
      odaiId: ODAI_VOTING_ID,
      slackTeamId: OTHER_TEAM_ID,
    })

    expect(result).toEqual(NoTargetOdaiError)
  })

  it('発表前は暫定順位を返し、回答者を含めない', async () => {
    await seedVotingScenario(testDb)
    const resolver = createResolver({ [USER_1]: '田中', [USER_2]: '佐藤' })

    const result = await createService(resolver).get({
      odaiId: ODAI_VOTING_ID,
      slackTeamId: TEAM_ID,
    })

    if (hasError(result)) throw new Error('detail should be returned')

    expect(result.publishedAt).toBeNull()
    expect(result.pointRanking.length).toBeGreaterThan(0)
    expect(
      result.pointRanking.every((kotae) => kotae.authorName === null),
    ).toBe(true)
    expect(
      result.countRanking.every((kotae) => kotae.authorName === null),
    ).toBe(true)
    // 発表前は名前を引く必要がないため Slack を呼ばない
    expect(resolver.calledWith).toEqual([])
  })

  it('発表前でも集計値は返す', async () => {
    await seedVotingScenario(testDb)

    const result = await createService(createResolver({})).get({
      odaiId: ODAI_VOTING_ID,
      slackTeamId: TEAM_ID,
    })

    if (hasError(result)) throw new Error('detail should be returned')

    expect(result.kotaeCount).toBe(3)
    expect(result.kotaeUserCount).toBe(2)
    expect(result.voteCount).toBe(4)
    expect(result.voteUserCount).toBe(2)
    expect(result.voteDistribution).toEqual({
      top3: 4,
      rank4to10: 0,
      rest: 0,
    })
  })

  it('結果レコードがあっても status が finished でなければ名前を出さない', async () => {
    // 結果登録から status 更新までの間に、投票中のお題として詳細を開いた状況
    await seedFinishedScenario(testDb)
    await testDb
      .update(odai)
      .set({ status: 'voting' })
      .where(eq(odai.id, ODAI_FINISHED_2_ID))
    const resolver = createResolver({ [USER_1]: '田中', [USER_2]: '佐藤' })

    const result = await createService(resolver).get({
      odaiId: ODAI_FINISHED_2_ID,
      slackTeamId: TEAM_ID,
    })

    if (hasError(result)) throw new Error('detail should be returned')

    expect(result.publishedAt).toBeNull()
    expect(
      [...result.pointRanking, ...result.countRanking].every(
        (kotae) => kotae.authorName === null,
      ),
    ).toBe(true)
    expect(resolver.calledWith).toEqual([])
  })

  it('発表済みは result の順位に表示名を付けて返す', async () => {
    await seedFinishedScenario(testDb)
    const resolver = createResolver({ [USER_1]: '田中', [USER_2]: '佐藤' })

    const result = await createService(resolver).get({
      odaiId: ODAI_FINISHED_2_ID,
      slackTeamId: TEAM_ID,
    })

    if (hasError(result)) throw new Error('detail should be returned')

    expect(result.publishedAt).toBe(new Date('2025-01-12').getTime())
    expect(result.pointRanking).toEqual([
      {
        authorName: '田中',
        content: expect.any(String),
        kotaeId: KOTAE_1_ID,
        point: 3,
        rank: 1,
      },
    ])
    expect(result.countRanking).toEqual([
      {
        authorName: '佐藤',
        content: expect.any(String),
        kotaeId: KOTAE_2_ID,
        point: 1,
        rank: 2,
      },
    ])
  })
})
