import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { hasError } from '../../api/Error'
import { OdaiPostgresRepositoryImpl } from '../../odai/OdaiPostgresRepositoryImpl'
import { OdaiServiceImpl } from '../../odai/OdaiService'
import { TEAM_ID, USER_3, seedOdai } from '../../test/seeds'
import {
  clearDb,
  recordQueries,
  startDb,
  stopDb,
  summarizeQueries,
  testDb,
} from '../../test/setupDb'
import { KotaePostgresRepositoryImpl } from '../KotaePostgresRepositoryImpl'
import { KotaeService, KotaeServiceImpl } from '../KotaeService'

describe('KotaeService', () => {
  let kotaeService: KotaeService

  beforeAll(async () => {
    await startDb()

    kotaeService = new KotaeServiceImpl(
      new KotaePostgresRepositoryImpl(testDb),
      new OdaiServiceImpl(new OdaiPostgresRepositoryImpl(testDb)),
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
    it('回答を作成する', async () => {
      await seedOdai(testDb, { status: 'posting' })

      const result = await kotaeService.create({
        id: '',
        slackTeamId: TEAM_ID,
        content: '新しい回答',
        createdBy: USER_3,
      })
      expect(hasError(result)).toBe(false)

      const kotaeResult = await kotaeService.getAllOfCurrentOdai({
        slackTeamId: TEAM_ID,
      })
      if (hasError(kotaeResult)) throw new Error(kotaeResult.message)

      expect(kotaeResult.kotaeList).toHaveLength(1)
      expect(kotaeResult.kotaeList[0]).toMatchObject({
        content: '新しい回答',
        createdBy: USER_3,
      })
    })

    it('同じ内容の回答は重複して登録されない', async () => {
      await seedOdai(testDb, { status: 'posting' })

      const params = {
        id: '',
        slackTeamId: TEAM_ID,
        content: '同じ回答',
        createdBy: USER_3,
      }
      await kotaeService.create(params)
      await kotaeService.create(params)

      const kotaeResult = await kotaeService.getAllOfCurrentOdai({
        slackTeamId: TEAM_ID,
      })
      if (hasError(kotaeResult)) throw new Error(kotaeResult.message)

      expect(kotaeResult.kotaeList).toHaveLength(1)
    })

    it('お題が存在しない場合は No Active Odai を返す', async () => {
      const result = await kotaeService.create({
        id: '',
        slackTeamId: TEAM_ID,
        content: '新しい回答',
        createdBy: USER_3,
      })

      expect(result).toMatchObject({ message: 'No Active Odai' })
    })
  })

  // ── DB 往復回数 ───────────────────────────────────────────

  describe('DB 往復回数', () => {
    it('1回の回答作成で発行されるクエリは3回', async () => {
      await seedOdai(testDb, { status: 'posting' })

      const { result, queries } = await recordQueries(() =>
        kotaeService.create({
          id: '',
          slackTeamId: TEAM_ID,
          content: '新しい回答',
          createdBy: USER_3,
        }),
      )

      expect(hasError(result)).toBe(false)
      expect(summarizeQueries(queries)).toEqual([
        'select Odai', // 現在のお題の解決
        'select Kotae', // 同一内容の回答が既にないかの確認
        'insert Kotae',
      ])
    })
  })
})
