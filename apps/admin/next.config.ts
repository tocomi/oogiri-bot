import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /**
   * 開発サーバーへ localhost 以外のホスト名でアクセスすることを許可する
   *
   * 既定では localhost からの `/_next/*` と HMR の WebSocket しか通らない。
   * iPad などの実機から LAN 経由で開くと内部エンドポイントが拒否され、
   * Client Component が hydrate されないまま「ドロワーが開かない」ように見えるため、
   * 手元のネットワークからのアクセスを通す。
   *
   * 開発時のみ参照される設定で、本番のビルドと配信には影響しない。
   */
  allowedDevOrigins: ['127.0.0.1', '192.168.*.*', '10.*.*.*', '*.local'],
}

export default nextConfig
