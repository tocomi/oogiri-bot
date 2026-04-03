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
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
}
