import { App } from '@slack/bolt'
import admin from 'firebase-admin'
import { config } from '../config'
import { Kotae as KotaeType } from '../kotae/Kotae'

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

type Kotae = Omit<KotaeType, 'createdAt'>

const getAllKotae = async (): Promise<Kotae[]> => {
  const snapshots = await admin.firestore().collectionGroup('kotae').get()
  const kotaeList: Kotae[] = []
  snapshots.forEach((snapshot) => {
    const data = snapshot.data()
    if (data.votedFirstCount === undefined) return
    kotaeList.push({
      votedCount: data.votedCount,
      votedFirstCount: data.votedFirstCount,
      votedSecondCount: data.votedSecondCount,
      votedThirdCount: data.votedThirdCount,
      content: data.content,
      createdBy: data.createdBy,
      votedByList: data.votedByList,
    })
  })
  return kotaeList
}

type GroupedKotae = {
  [createdBy: string]: {
    votedCount: number
    votedFirstCount: number
    votedSecondCount: number
    votedThirdCount: number
    kotaeCount: number
  }
}

const groupingKotae = (kotaeList: Kotae[]): GroupedKotae => {
  const result: GroupedKotae = {}
  kotaeList.forEach((kotae) => {
    const tmp = result[kotae.createdBy]
    if (!tmp) {
      result[kotae.createdBy] = {
        votedCount: kotae.votedCount,
        votedFirstCount: kotae.votedFirstCount,
        votedSecondCount: kotae.votedSecondCount,
        votedThirdCount: kotae.votedThirdCount,
        kotaeCount: 1,
      }
    } else {
      const current = result[kotae.createdBy]
      result[kotae.createdBy] = {
        votedCount: current.votedCount + kotae.votedCount,
        votedFirstCount: current.votedFirstCount + kotae.votedFirstCount,
        votedSecondCount: current.votedSecondCount + kotae.votedSecondCount,
        votedThirdCount: current.votedThirdCount + kotae.votedThirdCount,
        kotaeCount: current.kotaeCount + 1,
      }
    }
  })
  return result
}

const convertUserIdToName = async (groupedKotae: GroupedKotae) => {
  const converted: GroupedKotae = {}
  for (const [userId, value] of Object.entries(groupedKotae)) {
    const userInfo = await client.users.info({ user: userId }).catch(() => undefined)
    const userName = userInfo ? userInfo.user?.real_name || 'unknown' : 'unknown'
    converted[userName] = value
  }
  return converted
}

const main = async () => {
  const allKotae = await getAllKotae()
  const groupedKotae = groupingKotae(allKotae)
  const KotaeByUserName = await convertUserIdToName(groupedKotae)
  console.log(KotaeByUserName)
}

main()
