import { describe, expect, test } from 'vitest'

import {
  ADMIN_REPORTING_REVALIDATE_SECONDS,
  truncateAdminNow,
} from '../adminCache'

/** 日本時間 2026-08-07 00:00 ちょうど */
const ON_THE_MARK = new Date('2026-08-06T15:00:00Z').getTime()

describe('truncateAdminNow', () => {
  test('再取得の間隔で切り捨てる', () => {
    const resolution = ADMIN_REPORTING_REVALIDATE_SECONDS * 1000

    expect(truncateAdminNow(ON_THE_MARK)).toBe(ON_THE_MARK)
    expect(truncateAdminNow(ON_THE_MARK + 1)).toBe(ON_THE_MARK)
    expect(truncateAdminNow(ON_THE_MARK + resolution - 1)).toBe(ON_THE_MARK)
  })

  test('間隔をまたぐと次の値になる', () => {
    const resolution = ADMIN_REPORTING_REVALIDATE_SECONDS * 1000

    expect(truncateAdminNow(ON_THE_MARK + resolution)).toBe(
      ON_THE_MARK + resolution,
    )
  })
})
