import { describe, expect, test } from 'vitest'

import { createAdminAxisScale, createAdminHeatLevel } from '../adminUserScale'

describe('createAdminAxisScale', () => {
  test('目盛りがきりのよい間隔になる', () => {
    expect(createAdminAxisScale(45)).toEqual({
      max: 45,
      ticks: [0, 15, 30, 45],
    })
  })

  test('目盛りは整数になる', () => {
    const { ticks } = createAdminAxisScale(5)

    expect(ticks.every(Number.isInteger)).toBe(true)
  })

  test('最大値は実データを下回らない', () => {
    for (const max of [1, 3, 7, 13, 42, 99, 250, 1234]) {
      expect(createAdminAxisScale(max).max).toBeGreaterThanOrEqual(max)
    }
  })

  test('参加者がいなくても軸を描ける', () => {
    const { max, ticks } = createAdminAxisScale(0)

    expect(max).toBeGreaterThan(0)
    expect(ticks[0]).toBe(0)
  })
})

describe('createAdminHeatLevel', () => {
  test('0 件は色をつけない段階にする', () => {
    expect(createAdminHeatLevel(0, 4)).toBe(0)
  })

  test('1 件以上は 1〜4 の段階に収まる', () => {
    expect(createAdminHeatLevel(1, 4)).toBe(1)
    expect(createAdminHeatLevel(4, 4)).toBe(4)
    // 最大値を超える値が来ても段階は 4 で頭打ちにする
    expect(createAdminHeatLevel(9, 4)).toBe(4)
  })

  test('最大値が 0 でも段階を返す', () => {
    expect(createAdminHeatLevel(1, 0)).toBe(1)
  })
})
