import { App } from '@slack/bolt'
import { config } from '../config'
import { WebClient } from '@slack/web-api'

const { client } = new App({
  socketMode: true,
  token: config.slack.botToken,
  appToken: config.slack.appToken,
})

export const getSlackClient = (): WebClient => client
