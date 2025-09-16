import * as admin from 'firebase-admin'
import { COLLECTION_NAME } from '../const'
import { getMigrationFirestore, convertTimestamp } from './firebase-config'

export type FirestoreTeamData = {
  id: string
  name: string
}

export type FirestoreOdaiData = {
  id: string
  teamId: string
  title: string
  type?: 'normal' | 'ippon' // undefinedの場合はnormalとして扱う
  status: string
  dueDate?: admin.firestore.Timestamp
  imageUrl?: string
  createdBy: string
  createdAt: admin.firestore.Timestamp
  ipponVoteCount?: number
  winIpponCount?: number
}

export type FirestoreKotaeData = {
  id: string
  odaiId: string
  content: string
  createdBy: string
  createdAt: admin.firestore.Timestamp
  votedCount: number
  votedFirstCount: number
  votedSecondCount: number
  votedThirdCount: number
}

export type FirestoreVoteData = {
  id: string
  odaiId: string
  kotaeId: string
  votedBy: string
  rank: 1 | 2 | 3
  createdAt: admin.firestore.Timestamp
  kotaeContent: string
  kotaeCreatedBy: string
}

export type CollectionName = 'team' | 'odai' | 'kotae' | 'vote' | 'all'

// UUID v7 format regex pattern (also matches v4 for compatibility)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * IDがUUID形式かどうかを判定する
 * UUID形式のIDは既にSupabaseに移行済みのため、移行対象から除外する
 */
function isUuidFormat(id: string): boolean {
  return UUID_REGEX.test(id)
}

/**
 * UUID形式でないIDのレコードのみをフィルタリングする
 */
function filterNonUuidRecords<T extends { id: string }>(records: T[]): T[] {
  return records.filter((record) => !isUuidFormat(record.id))
}

/**
 * odaiの移行対象をフィルタリングする
 * - UUID形式でないIDのレコードのみ
 * - typeがipponのレコードは除外（移行対象外）
 * - typeがundefinedのレコードはnormalとして扱い移行対象
 */
function filterMigratableOdais(odais: FirestoreOdaiData[]): FirestoreOdaiData[] {
  return odais.filter(odai => {
    // UUID形式のIDは除外
    if (isUuidFormat(odai.id)) {
      return false
    }
    
    // typeがipponの場合は除外
    if (odai.type === 'ippon') {
      return false
    }
    
    // typeがundefinedまたはnormalの場合は移行対象
    return true
  })
}

export class FirestoreDataFetcher {
  private db: admin.firestore.Firestore

  constructor() {
    this.db = getMigrationFirestore()
  }

  async fetchAllTeams(): Promise<FirestoreTeamData[]> {
    console.log('📝 Fetching teams from Firestore...')

    try {
      const snapshot = await this.db.collection(COLLECTION_NAME.ROOT).get()

      if (snapshot.empty) {
        console.log('⚠️  No teams found in Firestore')
        return []
      }

      const allTeams: FirestoreTeamData[] = []
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        allTeams.push({
          id: doc.id,
          name: data.name || doc.id, // fallback to ID if name is missing
        })
      })

      // UUID形式でないIDのレコードのみをフィルタリング（既にSupabaseに移行済みのレコードを除外）
      const teams = filterNonUuidRecords(allTeams)

      console.log(`✅ Fetched ${allTeams.length} total teams, ${teams.length} non-UUID teams`)
      if (allTeams.length > teams.length) {
        console.log(
          `   📤 Excluded ${allTeams.length - teams.length} UUID-format teams (already migrated)`
        )
      }

      teams.forEach((team, index) => {
        console.log(`   ${index + 1}. Team: ${team.id} (${team.name})`)
      })

      return teams
    } catch (error) {
      console.error('❌ Error fetching teams:', error)
      throw error
    }
  }

  async fetchAllOdais(teamId: string): Promise<FirestoreOdaiData[]> {
    console.log(`📝 Fetching odais for team: ${teamId}`)

    try {
      const snapshot = await this.db
        .collection(COLLECTION_NAME.ROOT)
        .doc(teamId)
        .collection(COLLECTION_NAME.ODAI)
        .get()

      if (snapshot.empty) {
        console.log(`⚠️  No odais found for team: ${teamId}`)
        return []
      }

      const allOdais: FirestoreOdaiData[] = []
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        allOdais.push({
          id: doc.id,
          teamId,
          title: data.title,
          type: data.type, // undefinedもそのまま保持
          status: data.status,
          dueDate: data.dueDate,
          imageUrl: data.imageUrl,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          ipponVoteCount: data.ipponVoteCount,
          winIpponCount: data.winIpponCount,
        })
      })

      // 移行対象のodaiのみをフィルタリング
      const migratableOdais = filterMigratableOdais(allOdais)

      // 除外の内訳を計算
      const uuidCount = allOdais.filter(odai => isUuidFormat(odai.id)).length
      const ipponCount = allOdais.filter(odai => !isUuidFormat(odai.id) && odai.type === 'ippon').length

      console.log(`✅ Fetched ${allOdais.length} total odais, ${migratableOdais.length} migratable odais for team: ${teamId}`)
      if (allOdais.length > migratableOdais.length) {
        console.log(`   📤 Excluded ${uuidCount} UUID-format odais (already migrated)`)
        console.log(`   📤 Excluded ${ipponCount} ippon-type odais (migration not supported)`)
      }

      migratableOdais.forEach((odai, index) => {
        const createdAt = odai.createdAt ? convertTimestamp(odai.createdAt) : 'N/A'
        const type = odai.type || 'normal' // undefinedはnormalとして表示
        console.log(
          `   ${index + 1}. Odai: ${odai.id} - "${odai.title}" (${type}, ${
            odai.status
          }, ${new Date(createdAt as number).toISOString()})`
        )
      })

      return migratableOdais
    } catch (error) {
      console.error(`❌ Error fetching odais for team ${teamId}:`, error)
      throw error
    }
  }

  async fetchAllKotaes(teamId: string, odaiId: string): Promise<FirestoreKotaeData[]> {
    console.log(`📝 Fetching kotaes for odai: ${odaiId} (team: ${teamId})`)

    try {
      const snapshot = await this.db
        .collection(COLLECTION_NAME.ROOT)
        .doc(teamId)
        .collection(COLLECTION_NAME.ODAI)
        .doc(odaiId)
        .collection(COLLECTION_NAME.KOTAE)
        .get()

      if (snapshot.empty) {
        console.log(`⚠️  No kotaes found for odai: ${odaiId}`)
        return []
      }

      const allKotaes: FirestoreKotaeData[] = []
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        allKotaes.push({
          id: doc.id,
          odaiId,
          content: data.content,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          votedCount: data.votedCount || 0,
          votedFirstCount: data.votedFirstCount || 0,
          votedSecondCount: data.votedSecondCount || 0,
          votedThirdCount: data.votedThirdCount || 0,
        })
      })

      // UUID形式でないIDのレコードのみをフィルタリング（既にSupabaseに移行済みのレコードを除外）
      const kotaes = filterNonUuidRecords(allKotaes)

      console.log(
        `✅ Fetched ${allKotaes.length} total kotaes, ${kotaes.length} non-UUID kotaes for odai: ${odaiId}`
      )
      if (allKotaes.length > kotaes.length) {
        console.log(
          `   📤 Excluded ${allKotaes.length - kotaes.length} UUID-format kotaes (already migrated)`
        )
      }

      kotaes.forEach((kotae, index) => {
        const createdAt = kotae.createdAt ? convertTimestamp(kotae.createdAt) : 'N/A'
        console.log(
          `   ${index + 1}. Kotae: ${kotae.id} - "${kotae.content}" by ${kotae.createdBy} (votes: ${
            kotae.votedCount
          }, ${new Date(createdAt as number).toISOString()})`
        )
      })

      return kotaes
    } catch (error) {
      console.error(`❌ Error fetching kotaes for odai ${odaiId}:`, error)
      throw error
    }
  }

  async fetchAllVotes(teamId: string, odaiId: string): Promise<FirestoreVoteData[]> {
    console.log(`📝 Fetching votes for odai: ${odaiId} (team: ${teamId})`)

    try {
      // Firestoreでは投票データは odai/{odaiId}/vote に格納されている
      const snapshot = await this.db
        .collection(COLLECTION_NAME.ROOT)
        .doc(teamId)
        .collection(COLLECTION_NAME.ODAI)
        .doc(odaiId)
        .collection(COLLECTION_NAME.VOTE)
        .get()

      if (snapshot.empty) {
        console.log(`⚠️  No votes found for odai: ${odaiId}`)
        return []
      }

      const allVotes: FirestoreVoteData[] = []
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        allVotes.push({
          id: doc.id,
          odaiId,
          kotaeId: data.kotaeId,
          votedBy: data.votedBy,
          rank: data.rank,
          createdAt: data.createdAt,
          kotaeContent: data.kotaeContent,
          kotaeCreatedBy: data.kotaeCreatedBy,
        })
      })

      // UUID形式でないIDのレコードのみをフィルタリング（既にSupabaseに移行済みのレコードを除外）
      const votes = filterNonUuidRecords(allVotes)

      console.log(
        `✅ Fetched ${allVotes.length} total votes, ${votes.length} non-UUID votes for odai: ${odaiId}`
      )
      if (allVotes.length > votes.length) {
        console.log(
          `   📤 Excluded ${allVotes.length - votes.length} UUID-format votes (already migrated)`
        )
      }

      votes.forEach((vote, index) => {
        const createdAt = vote.createdAt ? convertTimestamp(vote.createdAt) : 'N/A'
        console.log(
          `   ${index + 1}. Vote: ${vote.id} - rank ${vote.rank} by ${vote.votedBy} for kotae ${
            vote.kotaeId
          } (${new Date(createdAt as number).toISOString()})`
        )
      })

      return votes
    } catch (error) {
      console.error(`❌ Error fetching votes for odai ${odaiId}:`, error)
      throw error
    }
  }

  async fetchAllData(collections: CollectionName[] = ['all']): Promise<{
    teams: FirestoreTeamData[]
    odais: FirestoreOdaiData[]
    kotaes: FirestoreKotaeData[]
    votes: FirestoreVoteData[]
  }> {
    const shouldFetch = (collectionName: CollectionName): boolean => {
      return collections.includes('all') || collections.includes(collectionName)
    }

    console.log('🚀 Starting selective data fetch from Firestore...')
    console.log(`📋 Collections to process: ${collections.join(', ')}`)

    if (collections.includes('team') || collections.includes('all')) {
      console.log(
        'ℹ️  Note: Team data will be fetched for reference but excluded from migration (already migrated manually)'
      )
    }

    // 常にteamデータは参照用に取得（他のコレクションのために必要）
    const teams = await this.fetchAllTeams()
    const allOdais: FirestoreOdaiData[] = []
    const allKotaes: FirestoreKotaeData[] = []
    const allVotes: FirestoreVoteData[] = []

    for (const team of teams) {
      console.log(`\n🔄 Processing team: ${team.id}`)

      // Odai の処理
      if (shouldFetch('odai')) {
        const odais = await this.fetchAllOdais(team.id)
        allOdais.push(...odais)

        for (const odai of odais) {
          console.log(`\n   🔄 Processing odai: ${odai.id}`)

          // Kotae の処理
          if (shouldFetch('kotae')) {
            const kotaes = await this.fetchAllKotaes(team.id, odai.id)
            allKotaes.push(...kotaes)
          }

          // Vote の処理
          if (shouldFetch('vote')) {
            const votes = await this.fetchAllVotes(team.id, odai.id)
            allVotes.push(...votes)
          }
        }
      } else {
        // Odaiを処理しない場合でも、KotaeやVoteが指定されていたら警告
        if (shouldFetch('kotae') || shouldFetch('vote')) {
          console.log(
            '   ⚠️  Skipping kotae/vote processing because odai is not included in collections'
          )
        }
      }
    }

    console.log('\n📊 Data fetch summary:')
    console.log(`   Teams: ${teams.length} (for reference only - will be excluded from migration)`)
    console.log(`   Odais: ${allOdais.length} ${shouldFetch('odai') ? '' : '(skipped)'}`)
    console.log(`   Kotaes: ${allKotaes.length} ${shouldFetch('kotae') ? '' : '(skipped)'}`)
    console.log(`   Votes: ${allVotes.length} ${shouldFetch('vote') ? '' : '(skipped)'}`)

    return {
      teams,
      odais: allOdais,
      kotaes: allKotaes,
      votes: allVotes,
    }
  }
}
