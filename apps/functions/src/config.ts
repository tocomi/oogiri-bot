export const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    // NOTE: 開発用の Socket Mode (dev.ts) でのみ使う App-Level Token
    appToken: process.env.SLACK_APP_TOKEN || '',
    teamId: process.env.SLACK_TEAM_ID || '',
    channelId: process.env.SLACK_CHANNEL_ID || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
}
