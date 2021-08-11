import dayjs from 'dayjs'

export const milliSecondsToYYYYMMDD = (milliSeconds: number | string) => {
  return dayjs(milliSeconds).format('YYYY/MM/DD')
}

export const diffMessageFromCurrent = (milliSeconds: number) => {
  const dateDiff = dayjs(milliSeconds).diff(dayjs(), 'day')
  if (dateDiff === 0) {
    return '今日まで！'
  }
  if (dateDiff < 0) {
    return '過ぎてる！'
  }
  return `あと${dateDiff}日`
}
