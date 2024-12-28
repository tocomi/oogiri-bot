import dayjs from 'dayjs'

export const milliSecondsToYYYYMMDD = (milliSeconds: number | string) => {
  return dayjs(milliSeconds).format('YYYY/MM/DD')
}

/**
 * 期限の日付と現在日付の日数差分を計算する
 * 現在は時間は設定できないので、endOfメソッドを使って設定された日付の一番遅い時間と比較している
 * @param milliSeconds
 * @returns number
 */
export const calculateDateDiff = (milliSeconds: number): number => {
  const dueDate = dayjs(milliSeconds).endOf('day')
  return dueDate.diff(dayjs(), 'day')
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
