import path from 'path'
import * as dotenv from 'dotenv'
import * as admin from 'firebase-admin'

// .envファイルを読み込み
dotenv.config({
  path: path.join(__dirname, '../../../..', '.env'),
})

// マイグレーション専用のFirebaseアプリ名
const MIGRATION_APP_NAME = 'migration-app'

// Firebase設定の型定義
interface FirebaseConfig {
  projectId: string
  privateKey: string
  clientEmail: string
}

// 環境変数から設定を取得
function getFirebaseConfig(): FirebaseConfig {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error(
      `
Firebase configuration is missing. Please set the following environment variables:
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL

See the migration README.md for setup instructions.
    `.trim()
    )
  }

  return {
    projectId,
    privateKey: privateKey.replace(/\\n/g, '\n'), // エスケープされた改行を復元
    clientEmail,
  }
}

// Firebase Admin SDKの初期化（マイグレーション専用）
function initializeMigrationFirebase(): admin.app.App {
  // 既に初期化済みの場合はそれを返す
  try {
    return admin.app(MIGRATION_APP_NAME)
  } catch (error) {
    // アプリが存在しない場合は新規作成
    const config = getFirebaseConfig()

    console.log('🔧 Initializing Firebase for migration...')
    console.log(`   Project ID: ${config.projectId}`)
    console.log(`   Client Email: ${config.clientEmail}`)

    return admin.initializeApp(
      {
        credential: admin.credential.cert({
          projectId: config.projectId,
          privateKey: config.privateKey,
          clientEmail: config.clientEmail,
        }),
        projectId: config.projectId,
      },
      MIGRATION_APP_NAME
    )
  }
}

// Firestoreインスタンスの取得
export function getMigrationFirestore(): admin.firestore.Firestore {
  const app = initializeMigrationFirebase()
  return app.firestore()
}

// Timestampの変換ユーティリティ（既存のfirestore.tsから独立）
export function convertTimestamp(firestoreTimestamp: admin.firestore.Timestamp): number {
  return firestoreTimestamp.toDate().getTime()
}

// Firestoreドキュメントの作成ユーティリティ
export async function createDoc<T extends admin.firestore.DocumentData>(
  docRef: admin.firestore.DocumentReference,
  data: T
): Promise<boolean> {
  return docRef
    .set(data)
    .then(() => true)
    .catch((error) => {
      console.error('Error creating document:', error)
      return false
    })
}

// Firebase接続のテスト関数
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing Firebase connection...')
    const firestore = getMigrationFirestore()

    // 簡単な接続テスト（存在しないコレクションを読み取り試行）
    const testRef = firestore.collection('_connection_test').limit(1)
    await testRef.get()

    console.log('✅ Firebase connection successful!')
    return true
  } catch (error) {
    console.error('❌ Firebase connection failed:', error)
    console.error('\nPossible causes:')
    console.error('- Invalid Firebase credentials')
    console.error('- Network connectivity issues')
    console.error('- Firestore not enabled for this project')
    console.error('- Insufficient permissions')
    return false
  }
}

// マイグレーション完了後のクリーンアップ
export async function cleanupMigrationFirebase(): Promise<void> {
  try {
    const app = admin.app(MIGRATION_APP_NAME)
    await app.delete()
    console.log('🧹 Firebase migration app cleaned up')
  } catch (error) {
    // アプリが存在しない場合は何もしない
  }
}
