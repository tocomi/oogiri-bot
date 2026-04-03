import path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({
  path: path.join(__dirname, '../../..', '.env'),
})

export const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    teamId: process.env.SLACK_TEAM_ID || '',
    channelId: process.env.SLACK_CHANNEL_ID || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
}
