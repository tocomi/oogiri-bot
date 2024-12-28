import admin from 'firebase-admin'
import { config } from '../config'
import { Kotae } from '../kotae/Kotae'
import { makePointRanking } from '../kotae/rank/makePointRanking'
import { makeVotedCountRanking } from '../kotae/rank/makeVotedCountRanking'

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.firebase.projectId,
    privateKey: config.firebase.privateKey,
    clientEmail: config.firebase.clientEmail,
  }),
})

type Odai = {
  id: string
  type: 'normal' | 'ippon'
  title: string
  imageUrl?: string
  dueDate: number
}

const getAllOdai = async () => {
  const snapshots = await admin
    .firestore()
    .collection('team')
    .doc(config.slack.teamId)
    .collection('odai')
    .where('status', '==', 'finished')
    .get()
  const odaiList: Odai[] = []
  snapshots.forEach((snapshot) => {
    if (!snapshot.data().dueDate) return
    odaiList.push({
      id: snapshot.id,
      type: snapshot.data().type,
      title: snapshot.data().title,
      imageUrl: snapshot.data().imageUrl,
      dueDate: (snapshot.data().dueDate as admin.firestore.Timestamp).toDate().getTime(),
    })
  })
  return odaiList.filter((odai) => odai.type !== 'ippon').sort((a, b) => b.dueDate - a.dueDate)
}

const getKotaeList = async (odaiId: string): Promise<Kotae[]> => {
  const snapshots = await admin
    .firestore()
    .collection('team')
    .doc(config.slack.teamId)
    .collection('odai')
    .doc(odaiId)
    .collection('kotae')
    .get()
  const kotaeList: Kotae[] = []
  snapshots.forEach((snapshot) => {
    kotaeList.push({
      content: snapshot.data().content,
      votedCount: snapshot.data().votedCount,
      votedFirstCount: snapshot.data().votedFirstCount,
      votedSecondCount: snapshot.data().votedSecondCount,
      votedThirdCount: snapshot.data().votedThirdCount,
      createdBy: snapshot.data().createdBy,
      createdAt: snapshot.data().createdAt,
      votedByList: [],
    })
  })
  return kotaeList
}

type StatBase = {
  kotaeContent: string
  userName: string
}

type PointStat = StatBase & {
  type: 'point'
  point: number
  votedFirstCount: number
  votedSecondCount: number
  votedThirdCount: number
}

type CountStat = StatBase & {
  type: 'count'
  votedCount: number
}

type OdaiResult = {
  id: string
  title: string
  imageUrl?: string
  dueDate: Date
  kotaeCount: number
  voteCount: number
  pointStats: PointStat[]
  countStats: CountStat[]
}

const makeOdaiResultList = async (odaiList: Odai[]): Promise<OdaiResult[]> => {
  const odaiResultList: OdaiResult[] = []

  for (const odai of odaiList) {
    const kotaeList = await getKotaeList(odai.id)
    const pointRanking = makePointRanking({ kotaeList, filterTopKotae: true })
    const votedCountRanking = makeVotedCountRanking({ kotaeList })
    const odaiResult: OdaiResult = {
      id: odai.id,
      title: odai.title,
      imageUrl: odai.imageUrl,
      dueDate: new Date(odai.dueDate),
      kotaeCount: kotaeList.length,
      voteCount: kotaeList.reduce((acc, cur) => acc + cur.votedCount, 0),
      pointStats: pointRanking
        .map((kotae) => ({
          type: 'point' as const,
          kotaeContent: kotae.content,
          userName: kotae.createdBy,
          point: kotae.point,
          votedFirstCount: kotae.votedFirstCount,
          votedSecondCount: kotae.votedSecondCount,
          votedThirdCount: kotae.votedThirdCount,
        }))
        .filter((stat) => !isNaN(stat.point)),
      countStats: votedCountRanking.map((kotae) => ({
        type: 'count' as const,
        kotaeContent: kotae.content,
        userName: kotae.createdBy,
        votedCount: kotae.votedCount,
      })),
    }
    odaiResultList.push(odaiResult)
  }
  return odaiResultList
}

const addResultFieldsToOdaiDoc = async (odaiResult: OdaiResult) => {
  await admin
    .firestore()
    .collection('team')
    .doc(config.slack.teamId)
    .collection('odai')
    .doc(odaiResult.id)
    .update({
      result: {
        kotaeCount: odaiResult.kotaeCount,
        voteCount: odaiResult.voteCount,
        pointStats: odaiResult.pointStats,
        countStats: odaiResult.countStats,
      },
    })
}

/**
 * 各 odai の結果を result サブコレクションに格納する
 */
const main = async () => {
  const odaiList = await getAllOdai()
  const odaiResultList = await makeOdaiResultList(odaiList)
  await Promise.all(odaiResultList.map((odaiResult) => addResultFieldsToOdaiDoc(odaiResult)))
}

main()
