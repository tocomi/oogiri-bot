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

type Kotae = Omit<KotaeType, 'createdAt' | 'votedByList'> & { id: string }

const getAllKotae = async (): Promise<Kotae[]> => {
  const snapshots = await admin.firestore().collectionGroup('kotae').get()
  const kotaeList: Kotae[] = []
  snapshots.forEach((snapshot) => {
    const data = snapshot.data()
    if (data.votedFirstCount === undefined) return
    kotaeList.push({
      id: snapshot.id,
      votedCount: data.votedCount,
      votedFirstCount: data.votedFirstCount,
      votedSecondCount: data.votedSecondCount,
      votedThirdCount: data.votedThirdCount,
      content: data.content,
      createdBy: data.createdBy,
    })
  })
  return kotaeList
}

const addKotaeCreatedBy = async (kotaeList: Kotae[]) => {
  const snapshots = await admin.firestore().collectionGroup('vote').get()
  snapshots.forEach((snapshot) => {
    const data = snapshot.data()
    const targetKotae = kotaeList.find((kotae) => kotae.id === data.kotaeId)
    if (!targetKotae) return
    snapshot.ref.set(
      {
        kotaeCreatedBy: targetKotae.createdBy,
      },
      { merge: true }
    )
  })
}

/**
 * vote コレクションのドキュメントに kotaeCreatedBy フィールドを追加するスクリプト
 */
const main = async () => {
  const allKotae = await getAllKotae()
  await addKotaeCreatedBy(allKotae)
}

main()
