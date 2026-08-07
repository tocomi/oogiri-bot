import { WebClient } from '@slack/web-api'

import { config } from '../config'
import { getSlackUserList } from '../util/getSlackUserList'

/** 解決できなかったユーザーの表示名 */
export const UNKNOWN_USER_NAME = 'unknown'

export interface AdminUserNameResolver {
  /**
   * Slack のユーザー ID を表示名に変換する
   * 結果発表で公開済みの入賞者名を管理画面にも出すために使う
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

  async resolve(userIds: string[]): Promise<{ [userId: string]: string }> {
    const unknownIds = [...new Set(userIds)].filter(
      (userId) => !this.cache.has(userId),
    )

    if (unknownIds.length) {
      try {
        const userInfoMap = await getSlackUserList({
          client: this.client,
          userIdList: unknownIds,
        })
        unknownIds.forEach((userId) => {
          const profile = userInfoMap[userId]?.profile
          const name = profile?.display_name || profile?.real_name
          // NOTE: 引けなかったものはキャッシュしない。次回の取得で回復させる
          if (name) this.cache.set(userId, name)
        })
      } catch (error) {
        // NOTE: 表示名が引けなくても順位と内容は返せるため、握りつぶして unknown に倒す
        console.error(error)
      }
    }

    return Object.fromEntries(
      [...new Set(userIds)].map((userId) => [
        userId,
        this.cache.get(userId) ?? UNKNOWN_USER_NAME,
      ]),
    )
  }
}
