import { WebClient } from '@slack/web-api'
import { config } from '../config'

export const getSlackClient = () => new WebClient(config.slack.botToken)
