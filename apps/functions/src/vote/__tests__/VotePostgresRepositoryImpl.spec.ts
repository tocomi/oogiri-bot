import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  KOTAE_1_ID,
  KOTAE_3_ID,
  ODAI_VOTING_ID,
  TEAM_ID,
  USER_1,
  USER_2,
  USER_3,
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

  // ── getMyVotesOfOdai ──────────────────────────────────────

  describe('getMyVotesOfOdai', () => {
    it('同一お題における自分の投票を回答内容つきで返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.getMyVotesOfOdai({
        slackTeamId: TEAM_ID,
        votedBy: USER_3,
        odaiId: ODAI_VOTING_ID,
      })

      expect(result).toHaveLength(3)
      expect(result).toContainEqual({
        id: 'vote-u3-k1-r1',
        kotaeId: KOTAE_1_ID,
        kotaeContent: '回答その1',
        rank: 1,
      })
    })

    it('別お題の投票は含まない', async () => {
      await seedVotingScenario(testDb)
      await seedPastOdaiVotes(testDb)

      // USER_1 は ODAI_FINISHED_1_ID でのみ投票している
      const result = await repo.getMyVotesOfOdai({
        slackTeamId: TEAM_ID,
        votedBy: USER_1,
        odaiId: ODAI_VOTING_ID,
      })

      expect(result).toHaveLength(0)
    })
  })

  // ── save ──────────────────────────────────────────────────

  describe('save', () => {
    // NOTE: 票が増えていないこと・既存の票 ID が維持されることも見るため、票を潰さずに返す
    const getVotes = async (votedBy: string) =>
      (
        await repo.getMyVotesOfOdai({
          slackTeamId: TEAM_ID,
          votedBy,
          odaiId: ODAI_VOTING_ID,
        })
      )
        .map(({ id, kotaeId, rank }) => ({ id, kotaeId, rank }))
        .sort((a, b) => a.id.localeCompare(b.id))

    it('投票を作成して Vote オブジェクトを返す', async () => {
      await seedVotingScenario(testDb)

      const result = await repo.save({
        id: 'vote-new',
        slackTeamId: TEAM_ID,
        content: '回答その3',
        votedBy: USER_2,
        rank: 2,
        odaiId: ODAI_VOTING_ID,
        kotaeId: KOTAE_3_ID,
        kotaeCreatedBy: USER_1,
        demotedVotes: [],
      })

      expect(result.votedBy).toBe(USER_2)
      expect(result.rank).toBe(2)
      expect(result.kotaeId).toBe(KOTAE_3_ID)
      expect(await getVotes(USER_2)).toEqual([
        { id: 'vote-new', kotaeId: KOTAE_3_ID, rank: 2 },
        { id: 'vote-u2-k1-r1', kotaeId: KOTAE_1_ID, rank: 1 },
      ])
    })

    it('currentVoteId を指定すると新規作成せず賞を付け替える', async () => {
      await seedVotingScenario(testDb)

      // USER_2 は KOTAE_1_ID に rank1 で投票済み
      await repo.save({
        id: 'vote-new',
        slackTeamId: TEAM_ID,
        content: '回答その1',
        votedBy: USER_2,
        rank: 3,
        odaiId: ODAI_VOTING_ID,
        kotaeId: KOTAE_1_ID,
        kotaeCreatedBy: USER_1,
        currentVoteId: 'vote-u2-k1-r1',
        demotedVotes: [],
      })

      // NOTE: 新規の票は作られず、既存の票の rank だけが変わる
      expect(await getVotes(USER_2)).toEqual([
        { id: 'vote-u2-k1-r1', kotaeId: KOTAE_1_ID, rank: 3 },
      ])
    })

    it('demotedVotes の票の賞を下げる', async () => {
      await seedVotingScenario(testDb)

      // USER_2 の KOTAE_1_ID の rank1 を KOTAE_3_ID に入れ直す
      await repo.save({
        id: 'vote-new',
        slackTeamId: TEAM_ID,
        content: '回答その3',
        votedBy: USER_2,
        rank: 1,
        odaiId: ODAI_VOTING_ID,
        kotaeId: KOTAE_3_ID,
        kotaeCreatedBy: USER_1,
        demotedVotes: [
          {
            id: 'vote-u2-k1-r1',
            kotaeId: KOTAE_1_ID,
            kotaeContent: '回答その1',
            from: 1,
            to: 2,
          },
        ],
      })

      expect(await getVotes(USER_2)).toEqual([
        { id: 'vote-new', kotaeId: KOTAE_3_ID, rank: 1 },
        { id: 'vote-u2-k1-r1', kotaeId: KOTAE_1_ID, rank: 2 },
      ])
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
