import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { hasError } from '../../api/Error'
import { KotaePostgresRepositoryImpl } from '../../kotae/KotaePostgresRepositoryImpl'
import { KotaeService, KotaeServiceImpl } from '../../kotae/KotaeService'
import { OdaiPostgresRepositoryImpl } from '../../odai/OdaiPostgresRepositoryImpl'
import { OdaiServiceImpl } from '../../odai/OdaiService'
import {
  KOTAE_1_ID,
  KOTAE_2_ID,
  KOTAE_3_ID,
  ODAI_POSTING_ID,
  TEAM_ID,
  USER_1,
  USER_2,
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

    const getVotedCounts = async () => {
      const kotaeResult = await kotaeService.getAllOfCurrentOdai({
        slackTeamId: TEAM_ID,
      })
      if (hasError(kotaeResult)) throw new Error(kotaeResult.message)
      return Object.fromEntries(
        kotaeResult.kotaeList.map((k) => [
          k.id,
          [k.votedFirstCount, k.votedSecondCount, k.votedThirdCount],
        ]),
      )
    }

    it('同じ回答に同じ賞で再投票すると Already Voted を返す', async () => {
      await seedVotingScenario(testDb)

      // USER_3 は KOTAE_1_ID（回答その1）に rank1 で投票済み
      const result = await voteService.create({
        id: '',
        slackTeamId: TEAM_ID,
        content: '回答その1',
        votedBy: USER_3,
        rank: 1,
      })

      expect(result).toMatchObject({ message: 'Already Voted' })
    })

    it('投票済みの回答に別の賞を選ぶと賞が付け替わる', async () => {
      await seedVotingScenario(testDb)

      // USER_2 は KOTAE_1_ID（回答その1）に rank1 で投票済み
      const result = await voteService.create({
        id: '',
        slackTeamId: TEAM_ID,
        content: '回答その1',
        votedBy: USER_2,
        rank: 3,
      })

      expect(result).toMatchObject({ previousRank: 1, demotedVotes: [] })
      // KOTAE_1_ID: rank1 は USER_3 の 1 票だけ残り、USER_2 の票が rank3 になる
      expect((await getVotedCounts())[KOTAE_1_ID]).toEqual([1, 0, 1])
    })

    it('rank1 を別の回答に入れ直すと元の回答は rank2 に下がる', async () => {
      await seedVotingScenario(testDb)

      // USER_2 は KOTAE_1_ID に rank1 を使用済み
      const result = await voteService.create({
        id: '',
        slackTeamId: TEAM_ID,
        content: '回答その3',
        votedBy: USER_2,
        rank: 1,
      })

      expect(result).toMatchObject({
        previousRank: undefined,
        demotedVotes: [
          { kotaeId: KOTAE_1_ID, kotaeContent: '回答その1', from: 1, to: 2 },
        ],
      })
      const counts = await getVotedCounts()
      expect(counts[KOTAE_1_ID]).toEqual([1, 1, 0])
      expect(counts[KOTAE_3_ID]).toEqual([1, 0, 0])
    })

    it('銅の回答を金に上げると元の金は銀、元の銀は銅に玉突きで下がる', async () => {
      await seedVotingScenario(testDb)

      // USER_1 は ODAI_VOTING_ID では未投票。金・銀・銅を 1 票ずつ入れてから付け替える
      const vote = (content: string, rank: 1 | 2 | 3) =>
        voteService.create({
          id: '',
          slackTeamId: TEAM_ID,
          content,
          votedBy: USER_1,
          rank,
        })
      await vote('回答その1', 1)
      await vote('回答その2', 2)
      await vote('回答その3', 3)
      const before = await getVotedCounts()

      const result = await vote('回答その3', 1)

      expect(result).toMatchObject({
        previousRank: 3,
        demotedVotes: [
          { kotaeId: KOTAE_1_ID, from: 1, to: 2 },
          { kotaeId: KOTAE_2_ID, from: 2, to: 3 },
        ],
      })
      // NOTE: USER_1 の票だけが動き、票数の合計は変わらない
      const after = await getVotedCounts()
      const diff = (id: string) => after[id].map((c, i) => c - before[id][i])
      expect(diff(KOTAE_1_ID)).toEqual([-1, 1, 0])
      expect(diff(KOTAE_2_ID)).toEqual([0, -1, 1])
      expect(diff(KOTAE_3_ID)).toEqual([1, 0, -1])
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
