import path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({
  path: path.join(__dirname, '../../..', '.env'),
})

export const config = {
  api: {
    endpoint: process.env.API_ENDPOINT || '',
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
    teamId: process.env.SLACK_TEAM_ID || '',
    channelId: process.env.SLACK_CHANNEL_ID || '',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  },
}
