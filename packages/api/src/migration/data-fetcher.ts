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
  type: 'normal' | 'ippon'
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

      const teams: FirestoreTeamData[] = []
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        teams.push({
          id: doc.id,
          name: data.name || doc.id, // fallback to ID if name is missing
        })
      })

      console.log(`✅ Fetched ${teams.length} teams`)
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

      const odais: FirestoreOdaiData[] = []
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        odais.push({
          id: doc.id,
          teamId,
          title: data.title,
          type: data.type,
          status: data.status,
          dueDate: data.dueDate,
          imageUrl: data.imageUrl,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          ipponVoteCount: data.ipponVoteCount,
          winIpponCount: data.winIpponCount,
        })
      })

      console.log(`✅ Fetched ${odais.length} odais for team: ${teamId}`)
      odais.forEach((odai, index) => {
        const createdAt = odai.createdAt ? convertTimestamp(odai.createdAt) : 'N/A'
        console.log(
          `   ${index + 1}. Odai: ${odai.id} - "${odai.title}" (${odai.type}, ${
            odai.status
          }, ${new Date(createdAt as number).toISOString()})`
        )
      })

      return odais
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

      const kotaes: FirestoreKotaeData[] = []
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        kotaes.push({
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

      console.log(`✅ Fetched ${kotaes.length} kotaes for odai: ${odaiId}`)
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

      const votes: FirestoreVoteData[] = []
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        votes.push({
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

      console.log(`✅ Fetched ${votes.length} votes for odai: ${odaiId}`)
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
