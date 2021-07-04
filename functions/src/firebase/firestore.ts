import * as admin from 'firebase-admin'

admin.initializeApp()

export const db = admin.firestore()

export const createNewDoc = async ({
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

export const convertTimestamp = (firestoreTimestamp: admin.firestore.Timestamp): number => {
  return firestoreTimestamp.toDate().getTime()
}
