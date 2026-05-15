import { kotae, odai, result, vote } from '../../db/schema'
import { TestDb } from '../setupDb'

// 共通 ID 定数（テスト内のアサーションで使い回す）
export const TEAM_ID = 'team-1'
export const OTHER_TEAM_ID = 'team-2'

export const ODAI_POSTING_ID = 'odai-posting'
export const ODAI_VOTING_ID = 'odai-voting'
export const ODAI_FINISHED_1_ID = 'odai-finished-1' // 古い
export const ODAI_FINISHED_2_ID = 'odai-finished-2' // 新しい（直近）

export const KOTAE_1_ID = 'kotae-1' // user-1 が投稿、票あり
export const KOTAE_2_ID = 'kotae-2' // user-2 が投稿、票あり
export const KOTAE_3_ID = 'kotae-3' // user-1 が投稿、票なし

export const USER_1 = 'user-1'
export const USER_2 = 'user-2'
export const USER_3 = 'user-3' // 投票者

// ── 単体シード（上書き可能） ──────────────────────────────────

export const seedOdai = async (
  db: TestDb,
  overrides: Partial<typeof odai.$inferInsert> = {},
) => {
  const base: typeof odai.$inferInsert = {
    id: 'odai-1',
    teamId: TEAM_ID,
    title: 'テストお題',
    type: 'normal',
    status: 'posting',
    dueDate: new Date('2025-01-31').toISOString(),
    imageUrl: null,
    createdBy: USER_1,
    createdAt: new Date('2025-01-01').toISOString(),
    ...overrides,
  }
  await db.insert(odai).values(base)
  return base
}

export const seedKotae = async (
  db: TestDb,
  overrides: Partial<typeof kotae.$inferInsert> = {},
) => {
  const base: typeof kotae.$inferInsert = {
    id: 'kotae-1',
    odaiId: 'odai-1',
    content: 'テスト回答',
    createdBy: USER_1,
    createdAt: new Date('2025-01-02').toISOString(),
    ...overrides,
  }
  await db.insert(kotae).values(base)
  return base
}

export const seedVote = async (
  db: TestDb,
  overrides: Partial<typeof vote.$inferInsert> = {},
) => {
  const base: typeof vote.$inferInsert = {
    id: 'vote-1',
    odaiId: 'odai-1',
    kotaeId: 'kotae-1',
    rank: 1,
    createdBy: USER_3,
    createdAt: new Date('2025-01-03').toISOString(),
    ...overrides,
  }
  await db.insert(vote).values(base)
  return base
}

// ── シナリオシード ────────────────────────────────────────────

/**
 * ステータス違いの複数お題を投入する。
 * getCurrent / getRecentFinished / getAllFinished の境界値テスト用。
 *
 * - posting: ODAI_POSTING_ID
 * - voting:  ODAI_VOTING_ID
 * - finished (古い): ODAI_FINISHED_1_ID
 * - finished (新しい): ODAI_FINISHED_2_ID
 * - 別チーム finished: OTHER_TEAM_ID（チーム分離の確認用）
 */
export const seedOdaiSet = async (db: TestDb) => {
  await db.insert(odai).values([
    {
      id: ODAI_POSTING_ID,
      teamId: TEAM_ID,
      title: '募集中お題',
      type: 'normal',
      status: 'posting',
      dueDate: new Date('2025-01-31').toISOString(),
      imageUrl: null,
      createdBy: USER_1,
      createdAt: new Date('2025-01-01').toISOString(),
    },
    {
      id: ODAI_VOTING_ID,
      teamId: TEAM_ID,
      title: '投票中お題',
      type: 'normal',
      status: 'voting',
      dueDate: new Date('2025-02-28').toISOString(),
      imageUrl: null,
      createdBy: USER_1,
      createdAt: new Date('2025-02-01').toISOString(),
    },
    {
      id: ODAI_FINISHED_1_ID,
      teamId: TEAM_ID,
      title: '古い終了お題',
      type: 'normal',
      status: 'finished',
      dueDate: new Date('2024-12-31').toISOString(),
      imageUrl: null,
      createdBy: USER_1,
      createdAt: new Date('2024-12-01').toISOString(),
    },
    {
      id: ODAI_FINISHED_2_ID,
      teamId: TEAM_ID,
      title: '新しい終了お題',
      type: 'normal',
      status: 'finished',
      dueDate: new Date('2025-01-15').toISOString(),
      imageUrl: null,
      createdBy: USER_1,
      createdAt: new Date('2025-01-10').toISOString(),
    },
    {
      id: 'odai-other-team',
      teamId: OTHER_TEAM_ID,
      title: '別チームお題',
      type: 'normal',
      status: 'finished',
      dueDate: new Date('2025-01-15').toISOString(),
      imageUrl: null,
      createdBy: USER_2,
      createdAt: new Date('2025-01-10').toISOString(),
    },
  ])
}

/**
 * 投票シナリオ用データを投入する。
 * checkDuplication / getAllOfCurrentOdai / getByContent の境界値テスト用。
 *
 * お題: ODAI_VOTING_ID（status='voting'）
 * 回答:
 *   - KOTAE_1_ID: USER_1 が投稿。rank1 票 × 2、rank2 票 × 1
 *   - KOTAE_2_ID: USER_2 が投稿。rank3 票 × 1
 *   - KOTAE_3_ID: USER_1 が投稿。票なし（0票の境界値）
 * 投票:
 *   - USER_3 → KOTAE_1_ID rank1（checkDuplication: alreadyVoted の前提）
 *   - USER_2 → KOTAE_1_ID rank1（同一kotaeに別ユーザーが rank1 → ok）
 *   - USER_3 → KOTAE_2_ID rank2（USER_3 が rank2 消費済み → alreadySameRankVoted の前提）
 *   - USER_3 → KOTAE_2_ID rank3（rank3 は同一odaiで複数可の確認用）
 */
export const seedVotingScenario = async (db: TestDb) => {
  await db.insert(odai).values({
    id: ODAI_VOTING_ID,
    teamId: TEAM_ID,
    title: '投票中お題',
    type: 'normal',
    status: 'voting',
    dueDate: new Date('2025-02-28').toISOString(),
    imageUrl: null,
    createdBy: USER_1,
    createdAt: new Date('2025-02-01').toISOString(),
  })

  await db.insert(kotae).values([
    {
      id: KOTAE_1_ID,
      odaiId: ODAI_VOTING_ID,
      content: '回答その1',
      createdBy: USER_1,
      createdAt: new Date('2025-02-02T00:00:00Z').toISOString(),
    },
    {
      id: KOTAE_2_ID,
      odaiId: ODAI_VOTING_ID,
      content: '回答その2',
      createdBy: USER_2,
      createdAt: new Date('2025-02-02T01:00:00Z').toISOString(),
    },
    {
      id: KOTAE_3_ID,
      odaiId: ODAI_VOTING_ID,
      content: '回答その3',
      createdBy: USER_1,
      createdAt: new Date('2025-02-02T02:00:00Z').toISOString(),
    },
  ])

  await db.insert(vote).values([
    {
      id: 'vote-u3-k1-r1',
      odaiId: ODAI_VOTING_ID,
      kotaeId: KOTAE_1_ID,
      rank: 1,
      createdBy: USER_3,
      createdAt: new Date('2025-02-03T00:00:00Z').toISOString(),
    },
    {
      id: 'vote-u2-k1-r1',
      odaiId: ODAI_VOTING_ID,
      kotaeId: KOTAE_1_ID,
      rank: 1,
      createdBy: USER_2,
      createdAt: new Date('2025-02-03T01:00:00Z').toISOString(),
    },
    {
      id: 'vote-u3-k2-r2',
      odaiId: ODAI_VOTING_ID,
      kotaeId: KOTAE_2_ID,
      rank: 2,
      createdBy: USER_3,
      createdAt: new Date('2025-02-03T02:00:00Z').toISOString(),
    },
    {
      id: 'vote-u3-k2-r3',
      odaiId: ODAI_VOTING_ID,
      kotaeId: KOTAE_2_ID,
      rank: 3,
      createdBy: USER_3,
      createdAt: new Date('2025-02-03T03:00:00Z').toISOString(),
    },
  ])
}

/**
 * 結果集計シナリオ用データを投入する。
 * getResult / getAllResults の境界値テスト用。
 */
export const seedFinishedScenario = async (db: TestDb) => {
  await db.insert(odai).values({
    id: ODAI_FINISHED_2_ID,
    teamId: TEAM_ID,
    title: '新しい終了お題',
    type: 'normal',
    status: 'finished',
    dueDate: new Date('2025-01-15').toISOString(),
    imageUrl: null,
    createdBy: USER_1,
    createdAt: new Date('2025-01-10').toISOString(),
  })

  await db.insert(kotae).values([
    {
      id: KOTAE_1_ID,
      odaiId: ODAI_FINISHED_2_ID,
      content: '1位回答',
      createdBy: USER_1,
      createdAt: new Date('2025-01-11').toISOString(),
    },
    {
      id: KOTAE_2_ID,
      odaiId: ODAI_FINISHED_2_ID,
      content: '2位回答',
      createdBy: USER_2,
      createdAt: new Date('2025-01-11').toISOString(),
    },
  ])

  await db.insert(vote).values([
    {
      id: 'vote-1',
      odaiId: ODAI_FINISHED_2_ID,
      kotaeId: KOTAE_1_ID,
      rank: 1,
      createdBy: USER_3,
      createdAt: new Date('2025-01-12').toISOString(),
    },
    {
      id: 'vote-2',
      odaiId: ODAI_FINISHED_2_ID,
      kotaeId: KOTAE_2_ID,
      rank: 2,
      createdBy: USER_3,
      createdAt: new Date('2025-01-12').toISOString(),
    },
  ])

  await db.insert(result).values([
    {
      id: 'result-1',
      odaiId: ODAI_FINISHED_2_ID,
      kotaeId: KOTAE_1_ID,
      type: 'point',
      point: 3,
      rank: 1,
      createdAt: new Date('2025-01-12').toISOString(),
    },
    {
      id: 'result-2',
      odaiId: ODAI_FINISHED_2_ID,
      kotaeId: KOTAE_2_ID,
      type: 'count',
      point: 1,
      rank: 2,
      createdAt: new Date('2025-01-12').toISOString(),
    },
  ])
}
