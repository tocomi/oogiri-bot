/**
 * 年度のサマリを集計するスクリプト
 * - TARGET_YEAR で指定した年度のデータを集計する
 * - command) npx ts-node ./packages/slackbot/src/script/annualSummary.ts
 */

import admin from 'firebase-admin'
import { config } from '../config'

const TARGET_YEAR = 2024

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.firebase.projectId,
    privateKey: config.firebase.privateKey,
    clientEmail: config.firebase.clientEmail,
  }),
})

type Kotae = {
  createdBy: string
  createdAt: number
}

const getAllKotae = async (): Promise<Kotae[]> => {
  const snapshots = await admin.firestore().collectionGroup('kotae').get()
  const kotaeList: Kotae[] = []
  snapshots.forEach((snapshot) => {
    const data = snapshot.data()
    if (data.createdBy) {
      kotaeList.push({
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate().getTime(),
      })
    }
  })
  return kotaeList
}

type Vote = {
  votedBy: string
  createdAt: number
}

const getAllVote = async (): Promise<Vote[]> => {
  const snapshots = await admin.firestore().collectionGroup('vote').get()
  const voteList: Vote[] = []
  snapshots.forEach((snapshot) => {
    const data = snapshot.data()
    if (data.votedBy) {
      voteList.push({
        votedBy: data.votedBy,
        createdAt: data.createdAt.toDate().getTime(),
      })
    }
  })
  return voteList
}

type Result = {
  kotaeCount: number
  voteCount: number
  uniquekotaeUserCount: number
  uniqueVoteUserCount: number
}

const main = async () => {
  const kotaeList = await getAllKotae()
  const voteList = await getAllVote()

  const annualKotaeList = kotaeList.filter((kotae) => {
    const date = new Date(kotae.createdAt)
    return date.getFullYear() === TARGET_YEAR
  })

  const annualVoteList = voteList.filter((vote) => {
    const date = new Date(vote.createdAt)
    return date.getFullYear() === TARGET_YEAR
  })

  const uniquekotaeUserList = Array.from(new Set(annualKotaeList.map((kotae) => kotae.createdBy)))

  const uniqueVoteUserList = Array.from(new Set(annualVoteList.map((vote) => vote.votedBy)))

  const result: Result = {
    kotaeCount: annualKotaeList.length,
    // NOTE: vote はサブコレクションが2つあるので2で割る
    voteCount: annualVoteList.length / 2,
    uniquekotaeUserCount: uniquekotaeUserList.length,
    uniqueVoteUserCount: uniqueVoteUserList.length,
  }

  console.log('👾 -> result:', result)
}

main()
