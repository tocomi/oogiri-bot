import { describe, expect, test } from 'vitest'

import {
  DEFAULT_ADMIN_PERIOD,
  createAdminPeriodRange,
  parseAdminPeriodPreset,
} from '../adminPeriod'

const NOW = new Date('2026-08-07T00:00:00Z').getTime()
const DAY_IN_MS = 24 * 60 * 60 * 1000

describe('parseAdminPeriodPreset', () => {
  test('既知の値はそのまま返す', () => {
    expect(parseAdminPeriodPreset('30d')).toBe('30d')
    expect(parseAdminPeriodPreset('all')).toBe('all')
  })

  test('未指定や不正な値は既定の期間に倒す', () => {
    expect(parseAdminPeriodPreset(undefined)).toBe(DEFAULT_ADMIN_PERIOD)
    expect(parseAdminPeriodPreset('7d')).toBe(DEFAULT_ADMIN_PERIOD)
  })
})

describe('createAdminPeriodRange', () => {
  test('指定した日数だけ遡った範囲を返す', () => {
    expect(createAdminPeriodRange('30d', NOW)).toEqual({
      from: NOW - 30 * DAY_IN_MS,
      to: NOW,
    })
    expect(createAdminPeriodRange('1y', NOW)).toEqual({
      from: NOW - 365 * DAY_IN_MS,
      to: NOW,
    })
  })

  test('全期間は開始を 0 にする', () => {
    expect(createAdminPeriodRange('all', NOW)).toEqual({ from: 0, to: NOW })
  })
})
