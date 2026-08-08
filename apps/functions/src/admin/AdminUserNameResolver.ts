import { WebClient } from '@slack/web-api'

import { config } from '../config'

export interface AdminUserNameResolver {
  /**
   * Slack のユーザー ID を表示名に変換する
   * 結果発表で公開済みの入賞者名を管理画面にも出すために使う
   * 引けなかったユーザーは結果に含めず、呼び出し側で名前なしとして扱えるようにする
   */
  resolve(userIds: string[]): Promise<{ [userId: string]: string }>
}

/**
 * Slack API で表示名を解決する
 * users.info はユーザーごとに 1 回叩くため、インスタンス内でキャッシュして呼び出しを抑える
 */
export class SlackAdminUserNameResolver implements AdminUserNameResolver {
  private client: WebClient
  private cache = new Map<string, string>()

  constructor(client: WebClient = new WebClient(config.slack.botToken)) {
    this.client = client
  }

  /**
   * 1 人分の表示名を取得する
   * 退職済みなど引けないユーザーが混ざっても他の解決を巻き込まないよう、ここで失敗を閉じ込める
   */
  private async fetchName(userId: string): Promise<string | null> {
    try {
      const response = await this.client.users.info({ user: userId })
      const profile = response.user?.profile
      return profile?.display_name || profile?.real_name || null
    } catch (error) {
      console.error(`Failed to resolve slack user: ${userId}`, error)
      return null
    }
  }

  async resolve(userIds: string[]): Promise<{ [userId: string]: string }> {
    const uniqueIds = [...new Set(userIds)]
    const missingIds = uniqueIds.filter((userId) => !this.cache.has(userId))

    const fetched = await Promise.all(
      missingIds.map(
        async (userId) => [userId, await this.fetchName(userId)] as const,
      ),
    )
    fetched.forEach(([userId, name]) => {
      // NOTE: 引けなかったものはキャッシュしない。次回の取得で回復させる
      if (name) this.cache.set(userId, name)
    })

    return Object.fromEntries(
      uniqueIds
        .map((userId) => [userId, this.cache.get(userId)] as const)
        .filter((entry): entry is readonly [string, string] =>
          Boolean(entry[1]),
        ),
    )
  }
}
