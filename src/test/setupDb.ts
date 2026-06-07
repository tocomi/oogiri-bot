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
let pool: Pool
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
  await pool.end()
  await container.stop()
}

export const clearDb = async () => {
  await testDb.delete(result)
  await testDb.delete(vote)
  await testDb.delete(kotae)
  await testDb.delete(odai)
  await testDb.delete(team)
}
