/** 目盛りの間隔に選ぶ、桁ごとのきりのよい数 */
const NICE_STEPS = [1, 1.5, 2, 2.5, 5]

/** 軸に並べる目盛りのおおよその数 */
const TICK_COUNT = 4

export type AdminAxisScale = {
  /** 軸の上限。目盛りの最大値と一致する */
  max: number
  /** 0 から max までの目盛り */
  ticks: number[]
}

/**
 * 実データの最大値から軸の目盛りを決める
 * 目盛りが 7 や 13 のような読みにくい値にならないよう、桁ごとのきりのよい幅に丸める
 *
 * @param maxValue 実データの最大値
 */
export const createAdminAxisScale = (maxValue: number): AdminAxisScale => {
  // 参加者がいない期間でも軸を描けるよう、下限を 1 にする
  const safeMax = Math.max(maxValue, 1)
  const target = safeMax / TICK_COUNT
  const magnitude = 10 ** Math.floor(Math.log10(target))

  const niceStep =
    NICE_STEPS.map((nice) => nice * magnitude).find((step) => step >= target) ??
    10 * magnitude

  // 回答数も投票数も整数なので、目盛りが小数にならないよう切り上げる
  const step = Math.max(1, Math.ceil(niceStep))
  const max = Math.ceil(safeMax / step) * step

  const ticks: number[] = []
  for (let value = 0; value <= max; value += step) {
    ticks.push(value)
  }

  return { max, ticks }
}

/**
 * ヒートマップの濃さの段階を求める
 * 0 は「参加していない」として色をつけず、1 以上を 4 段階に割り当てる
 *
 * @param value そのセルの件数
 * @param maxValue ヒートマップ全体の最大件数
 */
export const createAdminHeatLevel = (value: number, maxValue: number) => {
  if (value <= 0) return 0
  if (maxValue <= 0) return 1
  return Math.min(4, Math.ceil((value / maxValue) * 4))
}
