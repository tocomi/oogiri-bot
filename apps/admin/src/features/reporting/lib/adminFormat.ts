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
 * 締切のように時刻まで必要な箇所で使う
 */
export const formatAdminDateTime = (unixMs: number) =>
  dateTimeFormatter.format(new Date(unixMs))

/**
 * 期間や発表日の表示に使う年つきの日付にする
 * 全期間では複数年のお題が並ぶため年まで示し、
 * サーバーとクライアントで表示がずれないようタイムゾーンを固定する
 */
export const formatAdminFullDate = (unixMs: number) =>
  fullDateFormatter.format(new Date(unixMs))
