import { KotaePostgresRepositoryImpl } from './kotae/KotaePostgresRepositoryImpl'
import { KotaeService, KotaeServiceImpl } from './kotae/KotaeService'
import { OdaiPostgresRepositoryImpl } from './odai/OdaiPostgresRepositoryImpl'
import { OdaiService, OdaiServiceImpl } from './odai/OdaiService'
import { VotePostgresRepositoryImpl } from './vote/VotePostgresRepositoryImpl'
import { VoteService, VoteServiceImpl } from './vote/VoteService'

export type Services = {
  odaiService: OdaiService
  kotaeService: KotaeService
  voteService: VoteService
}

// NOTE: 本番 (index.ts) と開発用 Socket Mode (dev.ts) で同じ組み立てを使う
export const createServices = (): Services => {
  const odaiService = new OdaiServiceImpl(new OdaiPostgresRepositoryImpl())
  const kotaeService = new KotaeServiceImpl(
    new KotaePostgresRepositoryImpl(),
    odaiService,
  )
  const voteService = new VoteServiceImpl(
    new VotePostgresRepositoryImpl(),
    odaiService,
    kotaeService,
  )
  return { odaiService, kotaeService, voteService }
}
