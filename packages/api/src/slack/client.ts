import { App } from '@slack/bolt'
import { config } from '../config'

const { client } = new App({
  socketMode: true,
  token: config.slack.botToken,
  appToken: config.slack.appToken,
})

export const getSlackClient = () => client
