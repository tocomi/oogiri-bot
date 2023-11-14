import * as admin from 'firebase-admin'

admin.initializeApp()

export const db = admin.firestore()

export const firestore = admin.firestore

export const createDoc = async <T extends admin.firestore.DocumentData>(
  docRef: admin.firestore.DocumentReference,
  data: T
): Promise<boolean> => {
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
