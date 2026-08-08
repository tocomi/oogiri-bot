const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Tokyo',
})

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Tokyo',
})

const fullDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Tokyo',
})

/**
 * 一覧に使う短い日付にする
 * サーバーとクライアントで表示がずれないよう、タイムゾーンを固定する
 */
export const formatAdminDate = (unixMs: number) =>
  dateFormatter.format(new Date(unixMs))

/**
 * 締切のように時刻まで必要な箇所で使う
 */
export const formatAdminDateTime = (unixMs: number) =>
  dateTimeFormatter.format(new Date(unixMs))

/**
 * 期間の表示に使う年つきの日付にする
 */
export const formatAdminFullDate = (unixMs: number) =>
  fullDateFormatter.format(new Date(unixMs))
