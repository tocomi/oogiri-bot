import { App } from '@slack/bolt'
import dayjs from 'dayjs'
import { config } from '../config'
import { inspireNewOdai } from '../odai/action/inspireNewOdai'

// NOTE: 月曜日だけ投稿する。Heroku Scheduler だとそういう設定ができないため。
if (dayjs().day() === 1) {
  const app = new App({
    // NOTE: ソケットモードである必要はないが、そうしないとエラーが出てしまう
    socketMode: true,
    token: config.slack.botToken,
    appToken: config.slack.appToken,
  })

  inspireNewOdai({ slackTeamId: config.slack.teamId, client: app.client })
}
