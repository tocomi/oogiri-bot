import * as dotenv from 'dotenv'

dotenv.config()

export const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
    teamId: process.env.SLACK_TEAM_ID || '',
    channelId: process.env.SLACK_CHANNEL_ID || '',
  },
}
