import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  KOTAE_1_ID,
  KOTAE_3_ID,
  ODAI_VOTING_ID,
  OTHER_TEAM_ID,
  TEAM_ID,
  USER_1,
  USER_2,
  USER_3,
  seedDashboardMetricsScenario,
  seedOdai,
  seedPastOdaiVotes,
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

  // ── countAll ──────────────────────────────────────────────

  describe('countAll', () => {
    it('指定チームの投票数だけを返す', async () => {
      await seedDashboardMetricsScenario(testDb)

      const result = await repo.countAll({ slackTeamId: TEAM_ID })

      expect(result).toBe(2)
    })

    it('別チームの投票数だけを返す', async () => {
      await seedDashboardMetricsScenario(testDb)

      const result = await repo.countAll({ slackTeamId: OTHER_TEAM_ID })

      expect(result).toBe(1)
    })
  })

  // ── countByOdaiId ─────────────────────────────────────────

  describe('countByOdaiId', () => {
    it('指定お題の投票数だけを返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.countByOdaiId({ odaiId: ODAI_VOTING_ID })

      expect(result).toBe(4)
    })

    it('投票がないお題は 0 を返す', async () => {
      await seedOdai(testDb, { id: 'odai-no-votes' })

      const result = await repo.countByOdaiId({ odaiId: 'odai-no-votes' })

      expect(result).toBe(0)
    })
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

    it('別お題で rank1 を使っていても現在のお題では rank1 を使える', async () => {
      await seedVotingScenario(testDb)
      await seedPastOdaiVotes(testDb)

      // USER_1 は ODAI_FINISHED_1_ID で rank1 を使用済みだが、
      // ODAI_VOTING_ID ではまだ使っていない
      const result = await repo.checkDuplication({
        slackTeamId: TEAM_ID,
        votedBy: USER_1,
        rank: 1,
        odaiId: ODAI_VOTING_ID,
        kotaeId: KOTAE_3_ID,
      })

      expect(result).toBe('ok')
    })

    it('別お題で投票済みでも現在のお題の回答には投票できる', async () => {
      await seedVotingScenario(testDb)
      await seedPastOdaiVotes(testDb)

      // USER_1 は KOTAE_PAST_ID に投票済みだが、別お題の回答なので影響しない
      const result = await repo.checkDuplication({
        slackTeamId: TEAM_ID,
        votedBy: USER_1,
        rank: 3,
        odaiId: ODAI_VOTING_ID,
        kotaeId: KOTAE_1_ID,
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
