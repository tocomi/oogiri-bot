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

export class DataTransformer {
  transformTeam(firestoreTeam: FirestoreTeamData): PostgresTeamData {
    console.log(`🔄 Transforming team: ${firestoreTeam.id}`)

    return {
      id: firestoreTeam.id,
      name: firestoreTeam.name || firestoreTeam.id, // fallback to ID if name is missing
    }
  }

  transformOdai(firestoreOdai: FirestoreOdaiData): PostgresOdaiData {
    console.log(`🔄 Transforming odai: ${firestoreOdai.id} (${firestoreOdai.type})`)

    // dueDateの処理: normalタイプの場合は必須、ipponの場合はダミー値
    let dueDate: Date
    if (firestoreOdai.type === 'normal' && firestoreOdai.dueDate) {
      dueDate = firestoreOdai.dueDate.toDate()
    } else {
      // ipponタイプまたはdueDateがない場合はcreatedAtを使用
      dueDate = firestoreOdai.createdAt.toDate()
    }

    return {
      id: firestoreOdai.id,
      teamId: firestoreOdai.teamId,
      title: firestoreOdai.title,
      type: firestoreOdai.type,
      status: firestoreOdai.status,
      dueDate,
      imageUrl: firestoreOdai.imageUrl || null,
      createdBy: firestoreOdai.createdBy,
      createdAt: firestoreOdai.createdAt.toDate(),
    }
  }

  transformKotae(firestoreKotae: FirestoreKotaeData): PostgresKotaeData {
    console.log(`🔄 Transforming kotae: ${firestoreKotae.id}`)

    return {
      id: firestoreKotae.id,
      odaiId: firestoreKotae.odaiId,
      content: firestoreKotae.content,
      createdBy: firestoreKotae.createdBy,
      createdAt: firestoreKotae.createdAt.toDate(),
    }
  }

  transformVote(firestoreVote: FirestoreVoteData): PostgresVoteData {
    console.log(`🔄 Transforming vote: ${firestoreVote.id} (rank ${firestoreVote.rank})`)

    return {
      id: firestoreVote.id,
      odaiId: firestoreVote.odaiId,
      kotaeId: firestoreVote.kotaeId,
      rank: firestoreVote.rank,
      createdBy: firestoreVote.votedBy, // PostgreSQLでは createdBy に統一
      createdAt: firestoreVote.createdAt.toDate(),
    }
  }

  // Resultデータの生成（Firestoreから直接移行するのではなく、投票データから計算）
  generateResultsFromVotes(
    votes: FirestoreVoteData[],
    kotaes: FirestoreKotaeData[]
  ): PostgresResultData[] {
    console.log(`🔄 Generating result data from ${votes.length} votes`)

    const results: PostgresResultData[] = []
    const kotaeMap = new Map(kotaes.map((k) => [k.id, k]))

    // 投票データから各kotaeのポイントを計算
    const kotaePoints = new Map<string, number>()

    votes.forEach((vote) => {
      const currentPoints = kotaePoints.get(vote.kotaeId) || 0
      let points = 0

      // ランクに応じたポイント計算
      switch (vote.rank) {
        case 1:
          points = 3
          break
        case 2:
          points = 2
          break
        case 3:
          points = 1
          break
        default:
          points = 0
      }

      kotaePoints.set(vote.kotaeId, currentPoints + points)
    })

    // ポイント順でランキングを作成
    const sortedKotaes = Array.from(kotaePoints.entries()).sort(
      ([, pointsA], [, pointsB]) => pointsB - pointsA
    )

    sortedKotaes.forEach(([kotaeId, points], index) => {
      const kotae = kotaeMap.get(kotaeId)
      if (kotae) {
        results.push({
          id: `result_${kotae.id}`, // result用のIDを生成
          odaiId: kotae.odaiId,
          kotaeId: kotae.id,
          type: 'point',
          point: points,
          rank: index + 1,
          createdAt: new Date(), // 現在時刻をresult作成時刻とする
        })
      }
    })

    console.log(`✅ Generated ${results.length} result records`)
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

    // Results は vote データがある場合のみ生成
    const results =
      shouldTransform('vote') && firestoreData.votes.length > 0
        ? this.generateResultsFromVotes(firestoreData.votes, firestoreData.kotaes)
        : []

    console.log('\n📊 Data transformation summary:')
    console.log(`   Teams: 0 (excluded - already migrated manually)`)
    console.log(`   Odais: ${odais.length} ${shouldTransform('odai') ? '' : '(skipped)'}`)
    console.log(`   Kotaes: ${kotaes.length} ${shouldTransform('kotae') ? '' : '(skipped)'}`)
    console.log(`   Votes: ${votes.length} ${shouldTransform('vote') ? '' : '(skipped)'}`)
    console.log(
      `   Results: ${results.length} ${shouldTransform('vote') ? '' : '(skipped - no votes)'}`
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
