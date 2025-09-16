import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import { FirestoreDataFetcher, CollectionName } from './data-fetcher'
import {
  DataTransformer,
  PostgresTeamData,
  PostgresOdaiData,
  PostgresKotaeData,
  PostgresVoteData,
  PostgresResultData,
} from './data-transformer'

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

  async runDataFetchOnly(collections: CollectionName[] = ['all']): Promise<void> {
    console.log('🚀 Starting Firestore data fetch (dry run mode)...')
    console.log(`📁 Logs will be saved to: ${this.logDir}`)
    console.log(`🎯 Target collections: ${collections.join(', ')}`)

    try {
      // Firestoreから指定されたデータを取得
      const firestoreData = await this.fetcher.fetchAllData(collections)

      // 取得したデータをログファイルに保存
      this.writeLogFile('firestore-raw-data.json', firestoreData)

      // データ変換
      const transformedData = this.transformer.transformAllData(firestoreData, collections)

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

  async runFullMigration(collections: CollectionName[] = ['all']): Promise<void> {
    console.log('🚀 Starting full Firestore to PostgreSQL migration...')
    console.log(`📁 Logs will be saved to: ${this.logDir}`)
    console.log(`🎯 Target collections: ${collections.join(', ')}`)

    try {
      // データ取得と変換
      console.log('\n📥 Step 1: Fetching and transforming data...')
      const firestoreData = await this.fetcher.fetchAllData(collections)
      const transformedData = this.transformer.transformAllData(firestoreData, collections)

      // データ検証
      console.log('\n🔍 Step 2: Validating transformed data...')
      const isValid = this.transformer.validateTransformedData(transformedData)

      if (!isValid) {
        throw new Error('Data validation failed. Migration aborted.')
      }

      // ログファイル出力
      console.log('\n📝 Step 3: Writing log files...')
      this.writeLogFile('firestore-raw-data.json', firestoreData)
      this.writeLogFile('postgres-transformed-data.json', transformedData)
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

      // 実際のデータ挿入
      console.log('\n💾 Step 4: Inserting data to PostgreSQL...')
      await this.insertData(transformedData)

      console.log('\n🎉 Migration completed successfully!')
    } catch (error) {
      console.error('❌ Full migration failed:', error)

      // エラーログも保存
      this.writeLogFile('migration-error.json', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      })

      throw error
    }
  }

  // 将来の実装: 実際のデータ挿入
  //  TODO: 将来の実装
  private async insertData(data: {
    teams: PostgresTeamData[]
    odais: PostgresOdaiData[]
    kotaes: PostgresKotaeData[]
    votes: PostgresVoteData[]
    results: PostgresResultData[]
  }): Promise<void> {
    console.log('🔄 Starting data insertion to PostgreSQL...')
    console.log('📊 Data summary:')
    console.log(`   Teams: ${data.teams.length} (excluded - already migrated manually)`)
    console.log(`   Odais: ${data.odais.length}`)
    console.log(`   Kotaes: ${data.kotaes.length}`)
    console.log(`   Votes: ${data.votes.length}`)
    console.log(`   Results: ${data.results.length}`)

    try {
      await this.prisma.$transaction(async (tx) => {
        console.log('🗄️  Starting database transaction...')

        // Teams: スキップ（既に手動で移行済み）
        console.log('⏭️  Skipping teams insertion (already migrated manually)')

        // Odais
        if (data.odais.length > 0) {
          console.log(`📝 Inserting ${data.odais.length} odais...`)
          await tx.odai.createMany({
            data: data.odais,
            skipDuplicates: true, // 重複スキップ
          })
          console.log('✅ Odais inserted successfully')
        }

        // Kotaes
        if (data.kotaes.length > 0) {
          console.log(`💬 Inserting ${data.kotaes.length} kotaes...`)
          await tx.kotae.createMany({
            data: data.kotaes,
            skipDuplicates: true, // 重複スキップ
          })
          console.log('✅ Kotaes inserted successfully')
        }

        // Votes
        if (data.votes.length > 0) {
          console.log(`🗳️  Inserting ${data.votes.length} votes...`)
          await tx.vote.createMany({
            data: data.votes,
            skipDuplicates: true, // 重複スキップ
          })
          console.log('✅ Votes inserted successfully')
        }

        // Results
        if (data.results.length > 0) {
          console.log(`🏆 Inserting ${data.results.length} results...`)
          await tx.result.createMany({
            data: data.results,
            skipDuplicates: true, // 重複スキップ
          })
          console.log('✅ Results inserted successfully')
        }

        console.log('✅ All data inserted successfully within transaction')
      })

      console.log('🎉 Migration completed successfully!')
      console.log('📊 Final summary:')
      console.log(`   ✅ Odais migrated: ${data.odais.length}`)
      console.log(`   ✅ Kotaes migrated: ${data.kotaes.length}`)
      console.log(`   ✅ Votes migrated: ${data.votes.length}`)
      console.log(`   ✅ Results generated: ${data.results.length}`)
    } catch (error) {
      console.error('❌ Transaction failed, rolling back all changes:', error)
      throw error
    }
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
