/**
 * 単発で何かを bot に発言させたいときに利用
 */

import { App } from '@slack/bolt'
import admin from 'firebase-admin'
import { config } from '../config'
import { postMessage } from '../message/postMessage'

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.firebase.projectId,
    privateKey: config.firebase.privateKey,
    clientEmail: config.firebase.clientEmail,
  }),
})

const { client } = new App({
  socketMode: true,
  token: config.slack.botToken,
  appToken: config.slack.appToken,
})

const main = async () => {
  postMessage({
    client,
    blocks: [
      // {
      //   type: 'section',
      //   text: {
      //     type: 'mrkdwn',
      //     text: 'No Contest.',
      //   },
      // },
    ],
  })
}

main()
