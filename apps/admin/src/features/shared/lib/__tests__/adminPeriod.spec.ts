import { describe, expect, test } from 'vitest'

import {
  ADMIN_ALL_PERIOD,
  createAdminPeriodRange,
  formatAdminPeriodParam,
  parseAdminPeriod,
} from '../adminPeriod'

const AVAILABLE_YEARS = [2026, 2025, 2024]

/** 日本時間 2026-08-07 00:00 */
const NOW = new Date('2026-08-06T15:00:00Z').getTime()
/** 日本時間 2026-01-01 00:00 */
const YEAR_2026_START = new Date('2025-12-31T15:00:00Z').getTime()
/** 日本時間 2025-01-01 00:00 */
const YEAR_2025_START = new Date('2024-12-31T15:00:00Z').getTime()

describe('parseAdminPeriod', () => {
  test('全期間はそのまま返す', () => {
    expect(parseAdminPeriod(ADMIN_ALL_PERIOD, AVAILABLE_YEARS)).toBe(
      ADMIN_ALL_PERIOD,
    )
  })

  test('選べる年ならその年を返す', () => {
    expect(parseAdminPeriod('2024', AVAILABLE_YEARS)).toBe(2024)
  })

  test('未指定や不正な値は直近の年に倒す', () => {
    expect(parseAdminPeriod(null, AVAILABLE_YEARS)).toBe(2026)
    expect(parseAdminPeriod('30d', AVAILABLE_YEARS)).toBe(2026)
    expect(parseAdminPeriod('2020', AVAILABLE_YEARS)).toBe(2026)
  })

  test('選べる年がなければ全期間に倒す', () => {
    expect(parseAdminPeriod('2026', [])).toBe(ADMIN_ALL_PERIOD)
    expect(parseAdminPeriod(null, [])).toBe(ADMIN_ALL_PERIOD)
  })
})

describe('createAdminPeriodRange', () => {
  test('全期間は開始を 0 にする', () => {
    expect(createAdminPeriodRange(ADMIN_ALL_PERIOD, NOW)).toEqual({
      from: 0,
      to: NOW,
    })
  })

  test('過ぎた年は日本時間の元日から翌年の元日までを返す', () => {
    expect(createAdminPeriodRange(2025, NOW)).toEqual({
      from: YEAR_2025_START,
      to: YEAR_2026_START,
    })
  })

  test('進行中の年は終わりを現在時刻で止める', () => {
    expect(createAdminPeriodRange(2026, NOW)).toEqual({
      from: YEAR_2026_START,
      to: NOW,
    })
  })
})

describe('formatAdminPeriodParam', () => {
  test('searchParams に載せる文字列にする', () => {
    expect(formatAdminPeriodParam(ADMIN_ALL_PERIOD)).toBe('all')
    expect(formatAdminPeriodParam(2026)).toBe('2026')
  })
})
