import {
  afterAll,
  assert,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import {
  ODAI_FINISHED_1_ID,
  ODAI_FINISHED_2_ID,
  ODAI_POSTING_ID,
  ODAI_VOTING_ID,
  OTHER_TEAM_ID,
  TEAM_ID,
  USER_1,
  seedFinishedScenario,
  seedOdai,
  seedOdaiSet,
} from '../../test/seeds'
import { clearDb, startDb, stopDb, testDb } from '../../test/setupDb'
import { OdaiPostgresRepositoryImpl } from '../OdaiPostgresRepositoryImpl'

describe('OdaiPostgresRepositoryImpl', () => {
  let repo: OdaiPostgresRepositoryImpl

  beforeAll(async () => {
    await startDb()
    repo = new OdaiPostgresRepositoryImpl(testDb)
  })

  afterAll(async () => {
    await stopDb()
  })

  beforeEach(async () => {
    await clearDb()
  })

  // ── createNormal ──────────────────────────────────────────

  describe('createNormal', () => {
    it('お題を作成できる', async () => {
      const result = await repo.createNormal({
        id: 'odai-new',
        slackTeamId: TEAM_ID,
        title: '新しいお題',
        type: 'normal',
        dueDate: new Date('2025-03-31').getTime(),
        createdBy: USER_1,
      })

      expect(result).toBe(true)
    })
  })

  // ── getCurrent ────────────────────────────────────────────

  describe('getCurrent', () => {
    it('posting のお題を返す', async () => {
      await seedOdaiSet(testDb)

      const result = await repo.getCurrent({ slackTeamId: TEAM_ID })

      assert(result !== null)
      expect(result.status).not.toBe('finished')
    })

    it('finished のお題は返さない', async () => {
      await seedOdai(testDb, {
        id: 'odai-only-finished',
        status: 'finished',
      })

      const result = await repo.getCurrent({ slackTeamId: TEAM_ID })

      expect(result).toBeNull()
    })

    it('お題がない場合は null を返す', async () => {
      const result = await repo.getCurrent({ slackTeamId: TEAM_ID })

      expect(result).toBeNull()
    })

    it('別チームのお題は返さない', async () => {
      await seedOdai(testDb, { teamId: OTHER_TEAM_ID, status: 'posting' })

      const result = await repo.getCurrent({ slackTeamId: TEAM_ID })

      expect(result).toBeNull()
    })
  })

  // ── getRecentFinished ─────────────────────────────────────

  describe('getRecentFinished', () => {
    it('最新の finished お題を返す', async () => {
      await seedOdaiSet(testDb)

      const result = await repo.getRecentFinished({ slackTeamId: TEAM_ID })

      // ODAI_FINISHED_2_ID の方が新しい
      expect(result).toMatchObject({ id: ODAI_FINISHED_2_ID })
    })

    it('finished がない場合は null を返す', async () => {
      await seedOdai(testDb, { status: 'posting' })

      const result = await repo.getRecentFinished({ slackTeamId: TEAM_ID })

      expect(result).toBeNull()
    })
  })

  // ── getAllFinished ────────────────────────────────────────

  describe('getAllFinished', () => {
    it('finished お題を createdAt 降順で返す', async () => {
      await seedOdaiSet(testDb)

      const result = await repo.getAllFinished({ slackTeamId: TEAM_ID })

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(ODAI_FINISHED_2_ID) // 新しい方が先
      expect(result[1].id).toBe(ODAI_FINISHED_1_ID)
    })

    it('posting / voting は含まない', async () => {
      await seedOdaiSet(testDb)

      const result = await repo.getAllFinished({ slackTeamId: TEAM_ID })

      const ids = result.map((o) => o.id)
      expect(ids).not.toContain(ODAI_POSTING_ID)
      expect(ids).not.toContain(ODAI_VOTING_ID)
    })

    it('別チームのお題は含まない', async () => {
      await seedOdaiSet(testDb)

      const result = await repo.getAllFinished({ slackTeamId: TEAM_ID })

      expect(result.every((o) => o.id !== 'odai-other-team')).toBe(true)
    })
  })

  // ── updateStatus ──────────────────────────────────────────

  describe('updateStatus', () => {
    it('ステータスを更新できる', async () => {
      await seedOdai(testDb, { id: ODAI_POSTING_ID, status: 'posting' })

      await repo.updateStatus(
        { slackTeamId: TEAM_ID, status: 'voting' },
        ODAI_POSTING_ID,
      )

      const updated = await repo.getCurrent({ slackTeamId: TEAM_ID })
      assert(updated !== null)
      expect(updated.status).toBe('voting')
    })
  })

  // ── getAllResults / getResult ──────────────────────────────

  describe('getAllResults', () => {
    it('finished お題の一覧と集計数を返す', async () => {
      await seedFinishedScenario(testDb)

      const result = await repo.getAllResults({ slackTeamId: TEAM_ID })

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(ODAI_FINISHED_2_ID)
      expect(result[0].kotaeCount).toBe(2)
      expect(result[0].voteCount).toBe(2)
    })

    it('別チームのお題は含まない', async () => {
      await seedFinishedScenario(testDb)
      // 別チームの finished お題を追加
      await seedOdai(testDb, {
        id: 'odai-other',
        teamId: OTHER_TEAM_ID,
        status: 'finished',
      })

      const result = await repo.getAllResults({ slackTeamId: TEAM_ID })

      expect(result.every((o) => o.id !== 'odai-other')).toBe(true)
    })
  })

  describe('getResult', () => {
    it('結果の詳細（pointStats / countStats）を返す', async () => {
      await seedFinishedScenario(testDb)

      const result = await repo.getResult({
        slackTeamId: TEAM_ID,
        odaiId: ODAI_FINISHED_2_ID,
      })

      assert(result !== null)
      expect(result.pointStats).toHaveLength(1)
      expect(result.countStats).toHaveLength(1)
      expect(result.pointStats[0].rank).toBe(1)
      expect(result.countStats[0].rank).toBe(2)
    })

    it('存在しない odaiId は null を返す', async () => {
      const result = await repo.getResult({
        slackTeamId: TEAM_ID,
        odaiId: 'not-exist',
      })

      expect(result).toBeNull()
    })

    it('result レコードがない場合は null を返す', async () => {
      await seedOdai(testDb, { status: 'finished' })

      const result = await repo.getResult({
        slackTeamId: TEAM_ID,
        odaiId: 'odai-1',
      })

      expect(result).toBeNull()
    })
  })
})
