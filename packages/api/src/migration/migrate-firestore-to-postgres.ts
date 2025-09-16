import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import { FirestoreDataFetcher } from './data-fetcher'
import { DataTransformer } from './data-transformer'

export class FirestoreToPostgresMigrator {
  private fetcher: FirestoreDataFetcher
  private transformer: DataTransformer
  private prisma: PrismaClient
  private logDir: string

  constructor() {
    this.fetcher = new FirestoreDataFetcher()
    this.transformer = new DataTransformer()
    this.prisma = new PrismaClient()
    this.logDir = path.join(__dirname, '..', '..', '..', '..', 'migration-logs')

    // ログディレクトリの作成
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  private writeLogFile(filename: string, data: unknown): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const logPath = path.join(this.logDir, `${timestamp}_${filename}`)

    try {
      fs.writeFileSync(logPath, JSON.stringify(data, null, 2), 'utf-8')
      console.log(`📄 Log written to: ${logPath}`)
    } catch (error) {
      console.error(`❌ Failed to write log file ${logPath}:`, error)
    }
  }

  async runDataFetchOnly(): Promise<void> {
    console.log('🚀 Starting Firestore data fetch (dry run mode)...')
    console.log(`📁 Logs will be saved to: ${this.logDir}`)

    try {
      // Firestoreからすべてのデータを取得
      const firestoreData = await this.fetcher.fetchAllData()

      // 取得したデータをログファイルに保存
      this.writeLogFile('firestore-raw-data.json', firestoreData)

      // データ変換
      const transformedData = this.transformer.transformAllData(firestoreData)

      // 変換後データをログファイルに保存
      this.writeLogFile('postgres-transformed-data.json', transformedData)

      // データ検証
      const isValid = this.transformer.validateTransformedData(transformedData)

      // 検証結果をログファイルに保存
      this.writeLogFile('validation-result.json', {
        isValid,
        summary: {
          teams: transformedData.teams.length,
          odais: transformedData.odais.length,
          kotaes: transformedData.kotaes.length,
          votes: transformedData.votes.length,
          results: transformedData.results.length,
        },
        timestamp: new Date().toISOString(),
      })

      console.log('\n📊 Migration analysis complete!')
      console.log(`   Data validation: ${isValid ? '✅ PASSED' : '❌ FAILED'}`)
      console.log(
        `   Teams to migrate: ${transformedData.teams.length} (excluded - already migrated manually)`
      )
      console.log(`   Odais to migrate: ${transformedData.odais.length}`)
      console.log(`   Kotaes to migrate: ${transformedData.kotaes.length}`)
      console.log(`   Votes to migrate: ${transformedData.votes.length}`)
      console.log(`   Results to generate: ${transformedData.results.length}`)

      if (isValid) {
        console.log('\n✅ Data is ready for migration!')
        console.log('   To proceed with actual migration, use runFullMigration() method')
      } else {
        console.log('\n❌ Data validation failed. Please check the validation log for details.')
      }
    } catch (error) {
      console.error('❌ Migration analysis failed:', error)

      // エラーログも保存
      this.writeLogFile('migration-error.json', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      })

      throw error
    }
  }

  async runFullMigration(): Promise<void> {
    console.log('🚀 Starting full Firestore to PostgreSQL migration...')
    console.log(`📁 Logs will be saved to: ${this.logDir}`)

    try {
      // まずデータ取得と検証を実行
      await this.runDataFetchOnly()

      // 実際の移行処理はここに実装
      console.log('\n⚠️  Actual data insertion is not yet implemented.')
      console.log('   This prevents accidental data corruption.')
      console.log('   To implement data insertion:')
      console.log('   1. Review the generated log files')
      console.log('   2. Backup your PostgreSQL database')
      console.log('   3. Implement the insertData() method')
    } catch (error) {
      console.error('❌ Full migration failed:', error)
      throw error
    }
  }

  // 将来の実装: 実際のデータ挿入
  // @ts-expect-error TODO: 将来の実装
  private async insertData(_data: {
    teams: unknown[]
    odais: unknown[]
    kotaes: unknown[]
    votes: unknown[]
    results: unknown[]
  }): Promise<void> {
    console.log('🔄 Starting data insertion to PostgreSQL...')

    // TODO: トランザクション内でバッチ挿入を実装
    // await this.prisma.$transaction(async (tx) => {
    //   // Teams
    //   await tx.team.createMany({ data: data.teams })
    //   // Odais
    //   await tx.odai.createMany({ data: data.odais })
    //   // Kotaes
    //   await tx.kotae.createMany({ data: data.kotaes })
    //   // Votes
    //   await tx.vote.createMany({ data: data.votes })
    //   // Results
    //   await tx.result.createMany({ data: data.results })
    // })

    console.log('⚠️  Data insertion not implemented yet')
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  const migrator = new FirestoreToPostgresMigrator()

  const runMigration = async () => {
    try {
      // デフォルトではデータ取得のみ実行（安全なオプション）
      await migrator.runDataFetchOnly()
    } catch (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    } finally {
      await migrator.cleanup()
    }
  }

  runMigration()
}
