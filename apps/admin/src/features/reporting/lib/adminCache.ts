/**
 * 集計データを取り直す間隔（秒）
 * ドロワーの開閉のたびに一覧まで取り直すと待ち時間になるため、
 * 連続した操作の間だけ同じレスポンスを使い回す
 */
export const ADMIN_REPORTING_REVALIDATE_SECONDS = 30

/**
 * 毎回取得することを表すキャッシュ秒数
 */
export const ADMIN_NO_CACHE_SECONDS = 0

/**
 * 集計期間の終わりに使う現在時刻を求める
 * ミリ秒のまま使うと API の URL が毎回変わってキャッシュが効かないため、
 * 再取得の間隔と同じ幅に切り捨てて問い合わせ先を揃える
 *
 * @param now 現在時刻（Unix ミリ秒）
 */
export const truncateAdminNow = (now: number) => {
  const resolution = ADMIN_REPORTING_REVALIDATE_SECONDS * 1000
  return Math.floor(now / resolution) * resolution
}
