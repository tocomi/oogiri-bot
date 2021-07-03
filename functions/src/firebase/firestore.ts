import * as admin from 'firebase-admin'

admin.initializeApp()

const db = admin.firestore()

export const add = async ({
  collectionName,
  data,
}: {
  collectionName: string
  data: any
}): Promise<boolean> => {
  const docRef = db.collection(collectionName).doc()
  return docRef
    .set(data)
    .then(() => true)
    .catch((error) => {
      console.error(error)
      return false
    })
}
