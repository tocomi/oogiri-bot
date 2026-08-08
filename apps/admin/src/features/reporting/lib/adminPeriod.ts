/** 集計期間のプリセット */
export const ADMIN_PERIOD_PRESETS = [
  { label: '30 日', value: '30d', days: 30 },
  { label: '90 日', value: '90d', days: 90 },
  { label: '1 年', value: '1y', days: 365 },
  { label: '全期間', value: 'all', days: null },
] as const

export type AdminPeriodPreset = (typeof ADMIN_PERIOD_PRESETS)[number]['value']

/** 既定で表示する期間 */
export const DEFAULT_ADMIN_PERIOD: AdminPeriodPreset = '90d'

const DAY_IN_MS = 24 * 60 * 60 * 1000

/**
 * searchParams の値を期間プリセットに変換する
 * 不正な値でも画面を出せるよう、既定の期間に倒す
 */
export const parseAdminPeriodPreset = (value: string | undefined) => {
  const preset = ADMIN_PERIOD_PRESETS.find((item) => item.value === value)
  return preset?.value ?? DEFAULT_ADMIN_PERIOD
}

/**
 * 期間プリセットを API に渡す from / to に変換する
 * to は呼び出し時刻とし、from はそこから遡って求める
 */
export const createAdminPeriodRange = (
  preset: AdminPeriodPreset,
  now: number,
) => {
  const days = ADMIN_PERIOD_PRESETS.find((item) => item.value === preset)?.days

  return {
    from: days === null || days === undefined ? 0 : now - days * DAY_IN_MS,
    to: now,
  }
}
