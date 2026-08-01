import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { hasError } from '../../api/Error'
import { KotaePostgresRepositoryImpl } from '../../kotae/KotaePostgresRepositoryImpl'
import { KotaeService, KotaeServiceImpl } from '../../kotae/KotaeService'
import { OdaiPostgresRepositoryImpl } from '../../odai/OdaiPostgresRepositoryImpl'
import { OdaiServiceImpl } from '../../odai/OdaiService'
import {
  KOTAE_1_ID,
  KOTAE_3_ID,
  ODAI_POSTING_ID,
  TEAM_ID,
  USER_1,
  USER_3,
  seedKotae,
  seedOdai,
  seedPastOdaiVotes,
  seedVotingScenario,
} from '../../test/seeds'
import {
  clearDb,
  recordQueries,
  startDb,
  stopDb,
  summarizeQueries,
  testDb,
} from '../../test/setupDb'
import { VotePostgresRepositoryImpl } from '../VotePostgresRepositoryImpl'
import { VoteService, VoteServiceImpl } from '../VoteService'

describe('VoteService', () => {
  let voteService: VoteService
  let kotaeService: KotaeService

  beforeAll(async () => {
    await startDb()

    const odaiService = new OdaiServiceImpl(
      new OdaiPostgresRepositoryImpl(testDb),
    )
    kotaeService = new KotaeServiceImpl(
      new KotaePostgresRepositoryImpl(testDb),
      odaiService,
    )
    voteService = new VoteServiceImpl(
      new VotePostgresRepositoryImpl(testDb),
      odaiService,
      kotaeService,
    )
  })

  afterAll(async () => {
    await stopDb()
  })

  beforeEach(async () => {
    await clearDb()
  })

  // ── create ────────────────────────────────────────────────

  describe('create', () => {
    it('投票が回答の集計に反映される', async () => {
      await seedVotingScenario(testDb)

      // KOTAE_3_ID（回答その3）は票なしの状態から開始する
      const result = await voteService.create({
        id: '',
        slackTeamId: TEAM_ID,
        content: '回答その3',
        votedBy: USER_3,
        rank: 3,
      })

      expect(hasError(result)).toBe(false)

      const kotaeResult = await kotaeService.getAllOfCurrentOdai({
        slackTeamId: TEAM_ID,
      })
      if (hasError(kotaeResult)) throw new Error(kotaeResult.message)

      const target = kotaeResult.kotaeList.find((k) => k.id === KOTAE_3_ID)
      expect(target).toMatchObject({
        votedCount: 1,
        votedFirstCount: 0,
        votedSecondCount: 0,
        votedThirdCount: 1,
      })
    })

    it('同じ回答への再投票は Already Voted を返す', async () => {
      await seedVotingScenario(testDb)

      // USER_3 は KOTAE_1_ID（回答その1）に rank1 で投票済み
      const result = await voteService.create({
        id: '',
        slackTeamId: TEAM_ID,
        content: '回答その1',
        votedBy: USER_3,
        rank: 3,
      })

      expect(result).toMatchObject({ message: 'Already Voted' })
    })

    it('同一お題で rank1 を2回使うと Already Same Rank Voted を返す', async () => {
      await seedVotingScenario(testDb)

      // USER_3 は KOTAE_1_ID に rank1 を使用済み
      const result = await voteService.create({
        id: '',
        slackTeamId: TEAM_ID,
        content: '回答その3',
        votedBy: USER_3,
        rank: 1,
      })

      expect(result).toMatchObject({ message: 'Already Same Rank Voted' })
    })

    it('別お題で rank1 を使っていても現在のお題では投票できる', async () => {
      await seedVotingScenario(testDb)
      await seedPastOdaiVotes(testDb)

      // USER_1 は ODAI_FINISHED_1_ID で rank1 を使用済み
      const result = await voteService.create({
        id: '',
        slackTeamId: TEAM_ID,
        content: '回答その3',
        votedBy: USER_1,
        rank: 1,
      })

      expect(hasError(result)).toBe(false)
    })

    it('存在しない回答内容は No Target Kotae を返す', async () => {
      await seedVotingScenario(testDb)

      const result = await voteService.create({
        id: '',
        slackTeamId: TEAM_ID,
        content: '存在しない回答',
        votedBy: USER_3,
        rank: 3,
      })

      expect(result).toMatchObject({ message: 'No Target Kotae' })
    })

    it('回答受付中のお題には投票できない', async () => {
      await seedOdai(testDb, { id: ODAI_POSTING_ID, status: 'posting' })
      await seedKotae(testDb, {
        id: KOTAE_1_ID,
        odaiId: ODAI_POSTING_ID,
        content: '回答その1',
      })

      const result = await voteService.create({
        id: '',
        slackTeamId: TEAM_ID,
        content: '回答その1',
        votedBy: USER_3,
        rank: 1,
      })

      expect(result).toMatchObject({ message: 'No Voting Odai' })
    })

    it('お題が存在しない場合は No Active Odai を返す', async () => {
      const result = await voteService.create({
        id: '',
        slackTeamId: TEAM_ID,
        content: '回答その1',
        votedBy: USER_3,
        rank: 1,
      })

      expect(result).toMatchObject({ message: 'No Active Odai' })
    })
  })

  // ── DB 往復回数 ───────────────────────────────────────────

  describe('DB 往復回数', () => {
    it('1回の投票で発行されるクエリは4回', async () => {
      await seedVotingScenario(testDb)

      // NOTE: USER_1 は ODAI_VOTING_ID では未投票。
      // rank1 は重複チェックの対象になるため、まとめて1クエリで判定できていることも確認する
      const { result, queries } = await recordQueries(() =>
        voteService.create({
          id: '',
          slackTeamId: TEAM_ID,
          content: '回答その2',
          votedBy: USER_1,
          rank: 1,
        }),
      )

      expect(hasError(result)).toBe(false)
      expect(summarizeQueries(queries)).toEqual([
        'select Odai', // 現在のお題の解決。以降は解決済みの ID を使い回す
        'select Kotae', // 投票対象の回答の特定
        'select Vote', // 重複チェック（rank 重複も含めて1クエリ）
        'insert Vote',
      ])
    })
  })
})
