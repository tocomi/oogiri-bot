import { v7 as uuidv7 } from 'uuid'
import {
  FirestoreTeamData,
  FirestoreOdaiData,
  FirestoreKotaeData,
  FirestoreVoteData,
  CollectionName,
} from './data-fetcher'

// PostgreSQL挿入用のデータ型
export type PostgresTeamData = {
  id: string
  name: string
}

export type PostgresOdaiData = {
  id: string
  teamId: string
  title: string
  type: string
  status: string
  dueDate: Date
  imageUrl: string | null
  createdBy: string
  createdAt: Date
}

export type PostgresKotaeData = {
  id: string
  odaiId: string
  content: string
  createdBy: string
  createdAt: Date
}

export type PostgresVoteData = {
  id: string
  odaiId: string
  kotaeId: string
  rank: number
  createdBy: string
  createdAt: Date
}

export type PostgresResultData = {
  id: string
  odaiId: string
  kotaeId: string
  type: string
  point: number
  rank: number
  createdAt: Date
}

export const generateId = ({ timestamp }: { timestamp?: Date }): string => {
  return uuidv7({
    msecs: timestamp,
  })
}

export class DataTransformer {
  transformTeam(firestoreTeam: FirestoreTeamData): PostgresTeamData {
    return {
      id: firestoreTeam.id,
      name: firestoreTeam.name || firestoreTeam.id, // fallback to ID if name is missing
    }
  }

  transformOdai(firestoreOdai: FirestoreOdaiData): PostgresOdaiData {
    // typeがundefinedの場合はnormalとして扱う
    const type = firestoreOdai.type || 'normal'

    // dueDateの処理: normalタイプの場合は必須、ipponの場合はダミー値
    let dueDate: Date
    if (type === 'normal' && firestoreOdai.dueDate) {
      dueDate = firestoreOdai.dueDate.toDate()
    } else {
      // ipponタイプまたはdueDateがない場合はcreatedAtを使用
      dueDate = firestoreOdai.createdAt.toDate()
    }

    return {
      id: firestoreOdai.id,
      teamId: firestoreOdai.teamId,
      title: firestoreOdai.title,
      type: type, // undefinedの場合はnormalに変換済み
      status: firestoreOdai.status,
      dueDate,
      imageUrl: firestoreOdai.imageUrl || null,
      createdBy: firestoreOdai.createdBy,
      createdAt: firestoreOdai.createdAt.toDate(),
    }
  }

  transformKotae(firestoreKotae: FirestoreKotaeData): PostgresKotaeData {
    return {
      id: firestoreKotae.id,
      odaiId: firestoreKotae.odaiId,
      content: firestoreKotae.content,
      createdBy: firestoreKotae.createdBy,
      createdAt: firestoreKotae.createdAt.toDate(),
    }
  }

  transformVote(firestoreVote: FirestoreVoteData): PostgresVoteData {
    return {
      id: firestoreVote.id,
      odaiId: firestoreVote.odaiId,
      kotaeId: firestoreVote.kotaeId,
      rank: firestoreVote.rank || 3, // undefinedの場合は3として扱う
      createdBy: firestoreVote.votedBy, // PostgreSQLでは createdBy に統一
      createdAt: firestoreVote.createdAt.toDate(),
    }
  }

  // Resultデータの生成（Firestoreから直接移行するのではなく、投票データから計算）
  generateResultsFromVotes(
    votes: FirestoreVoteData[],
    kotaes: FirestoreKotaeData[]
  ): PostgresResultData[] {
    const results: PostgresResultData[] = []
    const kotaeMap = new Map(kotaes.map((k) => [k.id, k]))

    // odaiごとにデータを分離
    const odaiGroups = new Map<
      string,
      {
        votes: FirestoreVoteData[]
        kotaes: FirestoreKotaeData[]
      }
    >()

    // odaiごとにvoteとkotaeをグループ化
    votes.forEach((vote) => {
      const kotae = kotaeMap.get(vote.kotaeId)
      if (kotae) {
        if (!odaiGroups.has(kotae.odaiId)) {
          odaiGroups.set(kotae.odaiId, { votes: [], kotaes: [] })
        }
        odaiGroups.get(kotae.odaiId)?.votes.push(vote)
      }
    })

    kotaes.forEach((kotae) => {
      if (!odaiGroups.has(kotae.odaiId)) {
        odaiGroups.set(kotae.odaiId, { votes: [], kotaes: [] })
      }
      odaiGroups.get(kotae.odaiId)?.kotaes.push(kotae)
    })

    // 各odaiについてresultを生成
    odaiGroups.forEach((group, odaiId) => {
      // odaiの最新投票日時を計算
      const latestVoteDate =
        group.votes.length > 0
          ? group.votes.reduce((latest, vote) => {
              const voteDate = vote.createdAt.toDate()
              return voteDate > latest ? voteDate : latest
            }, new Date(0))
          : new Date()

      // 1. ポイントランキングの生成
      const pointResults = this.generatePointRanking(
        group.votes,
        group.kotaes,
        odaiId,
        latestVoteDate
      )
      results.push(...pointResults)

      // 2. 投票数ランキングの生成
      const voteResults = this.generateVoteCountRanking(
        group.votes,
        group.kotaes,
        odaiId,
        latestVoteDate
      )
      results.push(...voteResults)
    })

    return results
  }

  // ポイントランキング生成
  private generatePointRanking(
    votes: FirestoreVoteData[],
    kotaes: FirestoreKotaeData[],
    odaiId: string,
    createdAt: Date
  ): PostgresResultData[] {
    const kotaeMap = new Map(kotaes.map((k) => [k.id, k]))

    // 各kotaeのrank別投票数を集計
    const kotaeStats = new Map<
      string,
      {
        first: number
        second: number
        third: number
      }
    >()

    votes.forEach((vote) => {
      const current = kotaeStats.get(vote.kotaeId) || { first: 0, second: 0, third: 0 }

      switch (vote.rank || 3) {
        case 1:
          current.first += 1
          break
        case 2:
          current.second += 1
          break
        case 3:
          current.third += 1
          break
      }

      kotaeStats.set(vote.kotaeId, current)
    })

    // ポイント計算
    const FIRST_RANK_POINT = 5
    const SECOND_RANK_POINT = 3
    const THIRD_RANK_POINT = 1

    const pointedKotaes = Array.from(kotaeStats.entries())
      .map(([kotaeId, stats]) => {
        const kotae = kotaeMap.get(kotaeId)
        if (!kotae) return null

        const point =
          FIRST_RANK_POINT * stats.first +
          SECOND_RANK_POINT * stats.second +
          THIRD_RANK_POINT * stats.third

        return { kotaeId, point }
      })
      .filter(Boolean) as Array<{ kotaeId: string; point: number }>

    // ポイント順でソートしてランキング生成
    const sortedKotaes = pointedKotaes.sort((a, b) => b.point - a.point)
    return this.createRankingResults(sortedKotaes, odaiId, 'point', createdAt)
  }

  // 投票数ランキング生成
  private generateVoteCountRanking(
    votes: FirestoreVoteData[],
    kotaes: FirestoreKotaeData[],
    odaiId: string,
    createdAt: Date
  ): PostgresResultData[] {
    // 各kotaeの投票数を集計
    const kotaeVoteCounts = new Map<string, number>()

    votes.forEach((vote) => {
      const currentCount = kotaeVoteCounts.get(vote.kotaeId) || 0
      kotaeVoteCounts.set(vote.kotaeId, currentCount + 1)
    })

    const votedKotaes = Array.from(kotaeVoteCounts.entries()).map(([kotaeId, voteCount]) => ({
      kotaeId,
      point: voteCount, // pointフィールドに投票数を格納
    }))

    // 投票数順でソートしてランキング生成
    const sortedKotaes = votedKotaes.sort((a, b) => b.point - a.point)
    return this.createRankingResults(sortedKotaes, odaiId, 'count', createdAt)
  }

  // ランキング結果作成の共通処理
  private createRankingResults(
    sortedKotaes: Array<{ kotaeId: string; point: number }>,
    odaiId: string,
    type: 'point' | 'count',
    createdAt: Date
  ): PostgresResultData[] {
    const results: PostgresResultData[] = []
    let rank = 1
    let beforePoint = -1
    let stockRank = 1

    sortedKotaes.forEach((kotae) => {
      if (beforePoint >= 0) {
        if (beforePoint === kotae.point) {
          stockRank += 1
        } else {
          rank += stockRank
          stockRank = 1
        }
      }
      beforePoint = kotae.point

      // 上位3位以内のみresultとして保存
      if (rank <= 3) {
        results.push({
          id: generateId({ timestamp: createdAt }),
          odaiId: odaiId,
          kotaeId: kotae.kotaeId,
          type: type,
          point: kotae.point,
          rank: rank,
          createdAt: createdAt,
        })
      }
    })

    console.log('👾 -> results:', results)
    return results
  }

  transformAllData(
    firestoreData: {
      teams: FirestoreTeamData[]
      odais: FirestoreOdaiData[]
      kotaes: FirestoreKotaeData[]
      votes: FirestoreVoteData[]
    },
    collections: CollectionName[] = ['all']
  ): {
    teams: PostgresTeamData[]
    odais: PostgresOdaiData[]
    kotaes: PostgresKotaeData[]
    votes: PostgresVoteData[]
    results: PostgresResultData[]
  } {
    const shouldTransform = (collectionName: CollectionName): boolean => {
      return collections.includes('all') || collections.includes(collectionName)
    }

    console.log('🔄 Starting selective data transformation...')
    console.log(`📋 Collections to transform: ${collections.join(', ')}`)
    console.log('ℹ️  Note: Team data transformation skipped (already migrated manually)')

    // Teams は参照用のみで、実際の変換はスキップ
    const teams: PostgresTeamData[] = []

    // 各コレクションの変換処理
    const odais = shouldTransform('odai')
      ? firestoreData.odais.map((odai) => this.transformOdai(odai))
      : []

    const kotaes = shouldTransform('kotae')
      ? firestoreData.kotaes.map((kotae) => this.transformKotae(kotae))
      : []

    const votes = shouldTransform('vote')
      ? firestoreData.votes.map((vote) => this.transformVote(vote))
      : []

    // Results は vote または kotae データがある場合に常に生成（fetchモードでも実施）
    const results =
      firestoreData.votes.length > 0 && firestoreData.kotaes.length > 0
        ? this.generateResultsFromVotes(firestoreData.votes, firestoreData.kotaes)
        : []

    console.log('\n📊 Data transformation summary:')
    console.log(`   Teams: 0 (excluded - already migrated manually)`)
    console.log(`   Odais: ${odais.length} ${shouldTransform('odai') ? '' : '(skipped)'}`)
    console.log(`   Kotaes: ${kotaes.length} ${shouldTransform('kotae') ? '' : '(skipped)'}`)
    console.log(`   Votes: ${votes.length} ${shouldTransform('vote') ? '' : '(skipped)'}`)
    console.log(
      `   Results: ${results.length} ${
        results.length > 0 ? '(generated from available data)' : '(no data to process)'
      }`
    )

    return {
      teams,
      odais,
      kotaes,
      votes,
      results,
    }
  }

  validateTransformedData(data: {
    teams: PostgresTeamData[]
    odais: PostgresOdaiData[]
    kotaes: PostgresKotaeData[]
    votes: PostgresVoteData[]
    results: PostgresResultData[]
  }): boolean {
    console.log('🔍 Validating transformed data...')
    console.log('ℹ️  Note: Team validation skipped (already migrated manually)')

    const errors: string[] = []

    // Team validation をスキップ（手動移行済み）
    console.log('   ⏭️  Skipping team validation (manual migration completed)')

    // Odai validation - team参照チェックもスキップ
    console.log('   ⏭️  Skipping odai team reference validation (teams already migrated)')

    // Kotae validation
    const odaiIds = new Set(data.odais.map((o) => o.id))
    data.kotaes.forEach((kotae) => {
      if (!odaiIds.has(kotae.odaiId)) {
        errors.push(`Kotae ${kotae.id} references non-existent odai ${kotae.odaiId}`)
      }
    })

    // Vote validation
    const kotaeIds = new Set(data.kotaes.map((k) => k.id))
    data.votes.forEach((vote) => {
      if (!odaiIds.has(vote.odaiId)) {
        errors.push(`Vote ${vote.id} references non-existent odai ${vote.odaiId}`)
      }
      if (!kotaeIds.has(vote.kotaeId)) {
        errors.push(`Vote ${vote.id} references non-existent kotae ${vote.kotaeId}`)
      }
      if (![1, 2, 3].includes(vote.rank)) {
        errors.push(`Vote ${vote.id} has invalid rank ${vote.rank}`)
      }
    })

    if (errors.length > 0) {
      console.log('❌ Validation failed:')
      errors.forEach((error) => console.log(`   - ${error}`))
      return false
    }

    console.log('✅ Data validation passed')
    return true
  }
}
