import dayjs from 'dayjs'

export const milliSecondsToYYYYMMDD = (milliSeconds: number | string) => {
  return dayjs(milliSeconds).format('YYYY/MM/DD')
}

/**
 * 期限の日付と現在日付の日数差分から表示するメッセージを返す
 * 現在は時間は設定できないので、endOfメソッドを使って設定された日付の一番遅い時間と比較している
 * @param milliSeconds
 * @returns string
 */
export const diffMessageFromCurrent = (milliSeconds: number) => {
  const dueDate = dayjs(milliSeconds).endOf('day')
  const now = dayjs()

  if (now.isAfter(dueDate)) return '過ぎてる！'

  const dateDiff = dueDate.diff(dayjs(), 'day')
  if (dateDiff === 0) {
    return '今日まで！'
  }
  return `あと${dateDiff}日`
}
