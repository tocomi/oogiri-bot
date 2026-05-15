import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  KOTAE_1_ID,
  KOTAE_3_ID,
  ODAI_VOTING_ID,
  TEAM_ID,
  USER_1,
  USER_2,
  USER_3,
  seedVotingScenario,
} from '../../test/seeds'
import { clearDb, startDb, stopDb, testDb } from '../../test/setupDb'
import { VotePostgresRepositoryImpl } from '../VotePostgresRepositoryImpl'

describe('VotePostgresRepositoryImpl', () => {
  let repo: VotePostgresRepositoryImpl

  beforeAll(async () => {
    await startDb()
    repo = new VotePostgresRepositoryImpl(testDb)
  })

  afterAll(async () => {
    await stopDb()
  })

  beforeEach(async () => {
    await clearDb()
  })

  // ── checkDuplication ──────────────────────────────────────

  describe('checkDuplication', () => {
    it('初めての投票は ok を返す', async () => {
      await seedVotingScenario(testDb)

      // USER_1 は KOTAE_3_ID にまだ投票していない
      const result = await repo.checkDuplication({
        slackTeamId: TEAM_ID,
        votedBy: USER_1,
        rank: 3,
        odaiId: ODAI_VOTING_ID,
        kotaeId: KOTAE_3_ID,
      })

      expect(result).toBe('ok')
    })

    it('同じ回答に2回投票すると alreadyVoted を返す', async () => {
      await seedVotingScenario(testDb)

      // USER_3 はすでに KOTAE_1_ID に vote-u3-k1-r1 で投票済み
      const result = await repo.checkDuplication({
        slackTeamId: TEAM_ID,
        votedBy: USER_3,
        rank: 2,
        odaiId: ODAI_VOTING_ID,
        kotaeId: KOTAE_1_ID,
      })

      expect(result).toBe('alreadyVoted')
    })

    it('rank1 を同一お題で2回使うと alreadySameRankVoted を返す', async () => {
      await seedVotingScenario(testDb)

      // USER_3 はすでに KOTAE_1_ID に rank1 で投票済み
      // → 別の回答 KOTAE_3_ID に rank1 は使えない
      const result = await repo.checkDuplication({
        slackTeamId: TEAM_ID,
        votedBy: USER_3,
        rank: 1,
        odaiId: ODAI_VOTING_ID,
        kotaeId: KOTAE_3_ID,
      })

      expect(result).toBe('alreadySameRankVoted')
    })

    it('rank2 を同一お題で2回使うと alreadySameRankVoted を返す', async () => {
      await seedVotingScenario(testDb)

      // USER_3 はすでに KOTAE_2_ID に rank2 で投票済み
      const result = await repo.checkDuplication({
        slackTeamId: TEAM_ID,
        votedBy: USER_3,
        rank: 2,
        odaiId: ODAI_VOTING_ID,
        kotaeId: KOTAE_3_ID,
      })

      expect(result).toBe('alreadySameRankVoted')
    })

    it('rank3 は同一お題の別回答に何度でも使える（ok を返す）', async () => {
      await seedVotingScenario(testDb)

      // USER_3 はすでに KOTAE_2_ID に rank3 で投票済みだが、
      // KOTAE_3_ID への rank3 投票は許可される
      const result = await repo.checkDuplication({
        slackTeamId: TEAM_ID,
        votedBy: USER_3,
        rank: 3,
        odaiId: ODAI_VOTING_ID,
        kotaeId: KOTAE_3_ID,
      })

      expect(result).toBe('ok')
    })
  })

  // ── create ────────────────────────────────────────────────

  describe('create', () => {
    it('投票を作成して Vote オブジェクトを返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.create({
        id: 'vote-new',
        slackTeamId: TEAM_ID,
        content: '回答その3',
        votedBy: USER_2,
        rank: 2,
        odaiId: ODAI_VOTING_ID,
        kotaeId: KOTAE_3_ID,
        kotaeCreatedBy: USER_1,
      })

      expect(result.votedBy).toBe(USER_2)
      expect(result.rank).toBe(2)
      expect(result.kotaeId).toBe(KOTAE_3_ID)
    })
  })

  // ── getAllOfCurrentOdai ───────────────────────────────────

  describe('getAllOfCurrentOdai', () => {
    it('お題の全投票を返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getAllOfCurrentOdai(
        { slackTeamId: TEAM_ID },
        ODAI_VOTING_ID,
      )

      // seedVotingScenario で 4 票投入済み
      expect(result).toHaveLength(4)
    })

    it('投票がない場合は空配列を返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getAllOfCurrentOdai(
        { slackTeamId: TEAM_ID },
        'other-odai-id',
      )

      expect(result).toHaveLength(0)
    })
  })

  // ── getAllByUser ──────────────────────────────────────────

  describe('getAllByUser', () => {
    it('指定ユーザーの回答への投票を返す', async () => {
      await seedVotingScenario(testDb)

      // USER_1 は KOTAE_1_ID と KOTAE_3_ID を投稿
      // KOTAE_1_ID への投票が 2 件（KOTAE_3_ID への投票は 0 件）
      const result = await repo.getAllByUser({
        slackTeamId: TEAM_ID,
        userId: USER_1,
      })

      expect(result).toHaveLength(2)
      expect(result.every((v) => v.kotaeCreatedBy === USER_1)).toBe(true)
    })

    it('別ユーザーの回答への投票は含まない', async () => {
      await seedVotingScenario(testDb)

      // USER_2 は KOTAE_2_ID を投稿、そこへの投票は 2 件
      const result = await repo.getAllByUser({
        slackTeamId: TEAM_ID,
        userId: USER_2,
      })

      expect(result).toHaveLength(2)
      expect(result.every((v) => v.kotaeCreatedBy === USER_2)).toBe(true)
    })

    it('回答を投稿していないユーザーは空配列を返す', async () => {
      await seedVotingScenario(testDb)

      // USER_3 は投票者だが回答は投稿していない
      const result = await repo.getAllByUser({
        slackTeamId: TEAM_ID,
        userId: USER_3,
      })

      expect(result).toHaveLength(0)
    })
  })
})
