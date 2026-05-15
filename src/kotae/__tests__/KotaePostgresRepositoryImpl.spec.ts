import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  KOTAE_1_ID,
  KOTAE_2_ID,
  KOTAE_3_ID,
  ODAI_VOTING_ID,
  TEAM_ID,
  USER_1,
  USER_2,
  USER_3,
  seedVotingScenario,
} from '../../test/seeds'
import { clearDb, startDb, stopDb, testDb } from '../../test/setupDb'
import { KotaePostgresRepositoryImpl } from '../KotaePostgresRepositoryImpl'

describe('KotaePostgresRepositoryImpl', () => {
  let repo: KotaePostgresRepositoryImpl

  beforeAll(async () => {
    await startDb()
    repo = new KotaePostgresRepositoryImpl(testDb)
  })

  afterAll(async () => {
    await stopDb()
  })

  beforeEach(async () => {
    await clearDb()
  })

  // ── getAllOfCurrentOdai ───────────────────────────────────

  describe('getAllOfCurrentOdai', () => {
    it('お題の全回答を投票数つきで返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getAllOfCurrentOdai(
        { slackTeamId: TEAM_ID },
        ODAI_VOTING_ID,
      )

      expect(result).toHaveLength(3)
    })

    it('投票数が正しく集計される（複数票）', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getAllOfCurrentOdai(
        { slackTeamId: TEAM_ID },
        ODAI_VOTING_ID,
      )

      // KOTAE_1_ID: USER_3 と USER_2 が rank1 で投票 → votedCount=2, votedFirstCount=2
      const kotae1 = result.find((k) => k.id === KOTAE_1_ID)
      expect(kotae1?.votedCount).toBe(2)
      expect(kotae1?.votedFirstCount).toBe(2)
      expect(kotae1?.votedSecondCount).toBe(0)
    })

    it('票なしの回答は votedCount=0 で返る', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getAllOfCurrentOdai(
        { slackTeamId: TEAM_ID },
        ODAI_VOTING_ID,
      )

      const kotae3 = result.find((k) => k.id === KOTAE_3_ID)
      expect(kotae3?.votedCount).toBe(0)
      expect(kotae3?.votedFirstCount).toBe(0)
    })

    it('rank ごとの票数が正しく集計される', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getAllOfCurrentOdai(
        { slackTeamId: TEAM_ID },
        ODAI_VOTING_ID,
      )

      // KOTAE_2_ID: rank2 × 1, rank3 × 1
      const kotae2 = result.find((k) => k.id === KOTAE_2_ID)
      expect(kotae2?.votedSecondCount).toBe(1)
      expect(kotae2?.votedThirdCount).toBe(1)
    })
  })

  // ── getPersonalResult ─────────────────────────────────────

  describe('getPersonalResult', () => {
    it('指定ユーザーの回答だけ返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getPersonalResult(
        { slackTeamId: TEAM_ID, userId: USER_1 },
        ODAI_VOTING_ID,
      )

      // USER_1 は KOTAE_1_ID と KOTAE_3_ID を投稿
      expect(result).toHaveLength(2)
      expect(result.every((k) => k.createdBy === USER_1)).toBe(true)
    })

    it('別ユーザーの回答は含まない', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getPersonalResult(
        { slackTeamId: TEAM_ID, userId: USER_2 },
        ODAI_VOTING_ID,
      )

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(KOTAE_2_ID)
    })

    it('回答がない場合は空配列を返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getPersonalResult(
        { slackTeamId: TEAM_ID, userId: USER_3 }, // USER_3 は投票者のみで回答なし
        ODAI_VOTING_ID,
      )

      expect(result).toHaveLength(0)
    })
  })

  // ── getVotedBy ────────────────────────────────────────────

  describe('getVotedBy', () => {
    it('対象回答への投票一覧を返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getVotedBy({
        slackTeamId: TEAM_ID,
        odaiDocId: ODAI_VOTING_ID,
        kotaeDocId: KOTAE_1_ID,
      })

      expect(result).toHaveLength(2)
      expect(result.map((v) => v.votedBy)).toEqual(
        expect.arrayContaining([USER_3, USER_2]),
      )
    })

    it('票がない回答は空配列を返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getVotedBy({
        slackTeamId: TEAM_ID,
        odaiDocId: ODAI_VOTING_ID,
        kotaeDocId: KOTAE_3_ID,
      })

      expect(result).toHaveLength(0)
    })
  })

  // ── getByContent ──────────────────────────────────────────

  describe('getByContent', () => {
    it('内容が一致する回答を返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getByContent({
        slackTeamId: TEAM_ID,
        content: '回答その1',
        odaiDocId: ODAI_VOTING_ID,
      })

      expect(result).toMatchObject({ id: KOTAE_1_ID })
    })

    it('存在しない内容は null を返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getByContent({
        slackTeamId: TEAM_ID,
        content: '存在しない回答',
        odaiDocId: ODAI_VOTING_ID,
      })

      expect(result).toBeNull()
    })

    it('別お題の同じ内容は返さない', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getByContent({
        slackTeamId: TEAM_ID,
        content: '回答その1',
        odaiDocId: 'other-odai-id',
      })

      expect(result).toBeNull()
    })
  })

  // ── incrementVoteCount ────────────────────────────────────

  describe('incrementVoteCount', () => {
    it('常に true を返す（Postgres では no-op）', async () => {
      const result = await repo.incrementVoteCount({
        slackTeamId: TEAM_ID,
        odaiDocId: ODAI_VOTING_ID,
        kotaeDocId: KOTAE_1_ID,
        rank: 1,
      })

      expect(result).toBe(true)
    })
  })
})
