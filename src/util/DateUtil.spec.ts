import { diffMessageFromCurrent } from './DateUtil'

const DAY = 86400000

describe('期限の差分日付計算', () => {
  test('期限より2日先', () => {
    const milliSeconds = new Date().getTime() + DAY * 2
    const result = diffMessageFromCurrent(milliSeconds)
    expect(result).toBe('あと2日')
  })

  test('期限より1日先', () => {
    const milliSeconds = new Date().getTime() + DAY
    const result = diffMessageFromCurrent(milliSeconds)
    expect(result).toBe('あと1日')
  })

  test('期限当日', () => {
    const milliSeconds = new Date().getTime()
    const result = diffMessageFromCurrent(milliSeconds)
    expect(result).toBe('今日まで！')
  })

  test('期限翌日', () => {
    const milliSeconds = new Date().getTime() - DAY
    const result = diffMessageFromCurrent(milliSeconds)
    expect(result).toBe('過ぎてる！')
  })
})
