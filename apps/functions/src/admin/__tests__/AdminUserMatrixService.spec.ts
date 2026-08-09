import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { hasError, InternalServerError } from '../../api/Error'
import {
  seedSummaryScenario,
  seedUserMatrixLimitScenario,
  SUMMARY_PERIOD,
  TEAM_ID,
  USER_1,
  USER_2,
  USER_3,
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
import { ADMIN_USER_MATRIX_ODAI_LIMIT } from '../AdminUserMatrix'
import { AdminUserMatrixServiceImpl } from '../AdminUserMatrixService'

describe('AdminUserMatrixServiceImpl', () => {
  let service: AdminUserMatrixServiceImpl

  beforeAll(async () => {
    await startDb()
    service = new AdminUserMatrixServiceImpl({
      reportingRepository: new AdminReportingPostgresRepositoryImpl(testDb),
    })
  })

  afterAll(async () => {
    await stopDb()
  })

  beforeEach(async () => {
    await clearDb()
  })

  it('お題を古い順に並べ、ユーザーごとの回答数と投票数を同じ並びで返す', async () => {
    await seedSummaryScenario(testDb)

    const matrix = await service.get({
      slackTeamId: TEAM_ID,
      ...SUMMARY_PERIOD,
    })
    if (hasError(matrix)) throw new Error('matrix should be returned')

    expect(matrix.totalOdaiCount).toBe(2)
    expect(matrix.odaiList.map((odai) => odai.id)).toEqual([
      'odai-cur-1',
      'odai-cur-2',
    ])

    // NOTE: 行の並びは画面が一覧と揃えるため、ここでは userId で引いて確かめる
    const findRow = (userId: string) =>
      matrix.rows.find((row) => row.userId === userId)

    expect(findRow(USER_1)).toEqual({
      userId: USER_1,
      kotaeCounts: [2, 0],
      voteCounts: [0, 1],
    })
    expect(findRow(USER_2)).toEqual({
      userId: USER_2,
      kotaeCounts: [0, 1],
      voteCounts: [2, 0],
    })
    // 回答していないお題は 0 で埋まる
    expect(findRow(USER_3)).toEqual({
      userId: USER_3,
      kotaeCounts: [0, 0],
      voteCounts: [1, 0],
    })
  })

  it('お題が上限を超えたら直近だけに絞り、絞る前の総数を返す', async () => {
    await seedUserMatrixLimitScenario(testDb)

    const matrix = await service.get({
      slackTeamId: TEAM_ID,
      ...SUMMARY_PERIOD,
    })
    if (hasError(matrix)) throw new Error('matrix should be returned')

    expect(matrix.totalOdaiCount).toBe(31)
    expect(matrix.odaiList).toHaveLength(ADMIN_USER_MATRIX_ODAI_LIMIT)
    // 最も古い 1 件だけが落ち、残りは古い順に並ぶ
    expect(matrix.odaiList[0].id).toBe('odai-many-01')
    expect(matrix.odaiList.at(-1)?.id).toBe('odai-many-30')

    const row = matrix.rows.find((row) => row.userId === USER_1)
    expect(row?.kotaeCounts).toEqual(
      Array.from({ length: ADMIN_USER_MATRIX_ODAI_LIMIT }, () => 1),
    )
  })

  it('該当するお題がなければ空で返す', async () => {
    const matrix = await service.get({
      slackTeamId: TEAM_ID,
      ...SUMMARY_PERIOD,
    })

    expect(matrix).toEqual({ odaiList: [], rows: [], totalOdaiCount: 0 })
  })

  it('取得に失敗した場合は共通エラーを返す', async () => {
    const failedService = new AdminUserMatrixServiceImpl({
      reportingRepository: {
        getUserMatrixSource: async () => ({ status: 'error' }),
      },
    })

    const matrix = await failedService.get({
      slackTeamId: TEAM_ID,
      ...SUMMARY_PERIOD,
    })

    expect(matrix).toEqual(InternalServerError)
  })

  it('お題の件数が増えても DB 往復回数は変わらない', async () => {
    await seedUserMatrixLimitScenario(testDb)

    const { queries } = await recordQueries(() =>
      service.get({ slackTeamId: TEAM_ID, ...SUMMARY_PERIOD }),
    )

    expect(summarizeQueries(queries)).toEqual([
      'select Odai',
      'select Odai',
      'select Kotae',
      'select Vote',
    ])
  })
})
