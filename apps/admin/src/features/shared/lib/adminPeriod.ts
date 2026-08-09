/** 全期間を表す期間指定 */
export const ADMIN_ALL_PERIOD = 'all'

/** 集計期間の指定。全期間、または特定の年 */
export type AdminPeriod = typeof ADMIN_ALL_PERIOD | number

/**
 * 日本時間の UTC オフセット
 * 年の区切りを画面の日付表示と揃えるために使う
 */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * 日本時間におけるその年の元日 0 時を Unix ミリ秒で求める
 */
const createJstYearStart = (year: number) =>
  Date.UTC(year, 0, 1) - JST_OFFSET_MS

/**
 * 期間指定を URL の searchParams に載せる文字列にする
 */
export const formatAdminPeriodParam = (period: AdminPeriod) => String(period)

/**
 * searchParams の値を期間指定に変換する
 * 不正な値でも画面を出せるよう、既定の期間に倒す
 *
 * @param value searchParams から受け取った生の値
 * @param availableYears お題が存在する年（新しい順）
 */
export const parseAdminPeriod = (
  value: string | null,
  availableYears: number[],
): AdminPeriod => {
  if (value === ADMIN_ALL_PERIOD) return ADMIN_ALL_PERIOD

  const year = Number(value)
  if (Number.isInteger(year) && availableYears.includes(year)) return year

  // 直近の年を既定にし、まだお題がなければ全期間に倒す
  return availableYears[0] ?? ADMIN_ALL_PERIOD
}

/**
 * 期間指定を API に渡す from / to に変換する
 * 進行中の年は未来まで含めても意味がないため、終わりを呼び出し時刻で止める
 */
export const createAdminPeriodRange = (period: AdminPeriod, now: number) => {
  if (period === ADMIN_ALL_PERIOD) return { from: 0, to: now }

  return {
    from: createJstYearStart(period),
    to: Math.min(createJstYearStart(period + 1), now),
  }
}
