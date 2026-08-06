import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'path'
import { Pool } from 'pg'

import { db } from '../db/client'
import { kotae, odai, result, team, vote } from '../db/schema'

export type TestDb = typeof db

let container: StartedPostgreSqlContainer
let pool: Pool | undefined
export let testDb: TestDb

export const startDb = async () => {
  container = await new PostgreSqlContainer('postgres:16').start()
  pool = new Pool({ connectionString: container.getConnectionUri() })
  testDb = drizzle({ client: pool }) as TestDb
  await migrate(testDb, {
    migrationsFolder: path.resolve(__dirname, '../../drizzle'),
  })
}

export const stopDb = async () => {
  await pool?.end()
  await container?.stop()
}

/**
 * fn の実行中に発行された SQL を記録する。
 * DB 往復回数そのものを固定するための計測用ヘルパー。
 */
export const recordQueries = async <T>(
  fn: () => Promise<T>,
): Promise<{ result: T; queries: string[] }> => {
  const target = pool
  if (!target) throw new Error('DB が起動していません')

  const queries: string[] = []
  const original = target.query.bind(target) as (
    ...args: unknown[]
  ) => Promise<unknown>

  const patched = (...args: unknown[]) => {
    const [first] = args
    queries.push(
      typeof first === 'string'
        ? first
        : String((first as { text?: string })?.text ?? ''),
    )
    return original(...args)
  }
  target.query = patched as typeof target.query

  try {
    const result = await fn()
    return { result, queries }
  } finally {
    target.query = original as typeof target.query
  }
}

/**
 * 記録した SQL を `操作 テーブル名` の一覧に畳む。
 * 例: ['select Odai', 'select Kotae', 'select Vote', 'insert Vote']
 */
export const summarizeQueries = (queries: string[]): string[] =>
  queries.map((query) => {
    const operation = query.trim().split(/\s+/)[0].toLowerCase()
    const table = query.match(/(?:from|into|update)\s+"(\w+)"/)
    return `${operation} ${table?.[1] ?? '?'}`
  })

export const clearDb = async () => {
  await testDb.delete(result)
  await testDb.delete(vote)
  await testDb.delete(kotae)
  await testDb.delete(odai)
  await testDb.delete(team)
}
