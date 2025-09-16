#!/usr/bin/env node

/**
 * マイグレーション実行スクリプト
 *
 * 使用方法:
 * - データ取得のみ（安全）: yarn migration:fetch
 * - 完全移行（危険）: yarn migration:full
 */

import { FirestoreToPostgresMigrator } from './migrate-firestore-to-postgres'

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'fetch'

  console.log('🔧 Firestore to PostgreSQL Migration Tool')
  console.log(`📋 Command: ${command}`)
  console.log(`⏰ Started at: ${new Date().toISOString()}`)

  const migrator = new FirestoreToPostgresMigrator()

  try {
    switch (command) {
      case 'fetch':
        console.log('\n🔍 Running data fetch and analysis only...')
        console.log('   This is a safe operation that only reads Firestore data')
        console.log('   and generates log files for review.\n')
        await migrator.runDataFetchOnly()
        break

      case 'full':
        console.log('\n⚠️  WARNING: Running full migration!')
        console.log('   This will modify your PostgreSQL database.')
        console.log('   Make sure you have a backup!\n')

        // 確認プロンプト（Node.jsでは実装が複雑なので、コメントで注意喚起）
        console.log('🚨 SAFETY CHECK: Full migration is not yet implemented.')
        console.log('   Please review the fetch logs first and implement')
        console.log('   the actual data insertion code manually.\n')

        await migrator.runDataFetchOnly() // 現在は安全なfetchのみ実行
        break

      case 'help':
        console.log('\n📖 Available commands:')
        console.log('   fetch  - Fetch data from Firestore and generate logs (safe)')
        console.log('   full   - Run full migration (not implemented yet)')
        console.log('   help   - Show this help message')
        return

      default:
        console.log(`\n❌ Unknown command: ${command}`)
        console.log('   Run with "help" to see available commands')
        process.exit(1)
    }

    console.log('\n✅ Migration completed successfully!')
    console.log(`⏰ Finished at: ${new Date().toISOString()}`)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    console.log(`⏰ Failed at: ${new Date().toISOString()}`)
    process.exit(1)
  } finally {
    await migrator.cleanup()
  }
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled rejection:', error)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:', error)
  process.exit(1)
})

if (require.main === module) {
  main()
}
