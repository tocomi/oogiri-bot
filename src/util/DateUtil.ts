import dayjs from 'dayjs'

export const milliSecondsToYYYYMMDD = (milliSeconds: number | string) => {
  return dayjs(milliSeconds).format('YYYY/MM/DD')
}

/**
 * 期限の日付と現在日付の日数差分を計算する
 * 時刻の影響を除くため startOf('day') で日付を揃えてから差分を計算している
 * @param milliSeconds
 * @returns number
 */
export const calculateDateDiff = (milliSeconds: number): number => {
  const dueDate = dayjs(milliSeconds).startOf('day')
  const today = dayjs().startOf('day')
  return dueDate.diff(today, 'day')
}

/**
 * 期限の日付と現在日付の日数差分から表示するメッセージを返す
 * @param milliSeconds
 * @returns string
 */
export const diffMessageFromCurrent = (milliSeconds: number) => {
  const dateDiff = calculateDateDiff(milliSeconds)
  if (dateDiff < 0) {
    return '過ぎてます！'
  }
  if (dateDiff === 0) {
    return '今日までですよー！'
  }
  return `あと${dateDiff}日！`
}
