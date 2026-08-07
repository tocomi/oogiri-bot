import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  inArray,
  lt,
  min,
  sql,
} from 'drizzle-orm'

import { SlackPeriodParams } from '../api/Api'
import { db as defaultDb } from '../db/client'
import { kotae, odai, result, vote } from '../db/schema'
import { OdaiStatus } from '../odai/Odai'
import { AdminOdaiListItem, AdminOdaiListParams } from './AdminOdaiList'
import { AdminReportingRepository } from './AdminReportingRepository'
import { AdminSummaryCounts } from './AdminSummary'

type Db = typeof defaultDb

export class AdminReportingPostgresRepositoryImpl implements AdminReportingRepository {
  private db: Db

  constructor(db: Db = defaultDb) {
    this.db = db
  }

  /**
   * 指定期間の集計値を Postgres から取得する
   * 件数と人数は同じ絞り込みで引けるため、テーブルごとに 1 クエリにまとめる
   */
  async getSummaryCounts({
    slackTeamId,
    from,
    to,
  }: SlackPeriodParams): Promise<AdminSummaryCounts | null> {
    const fromAt = new Date(from).toISOString()
    const toAt = new Date(to).toISOString()

    try {
      const [odaiRows, kotaeRows, voteRows] = await Promise.all([
        this.db
          .select({ count: count() })
          .from(odai)
          .where(
            and(
              eq(odai.teamId, slackTeamId),
              gte(odai.createdAt, fromAt),
              lt(odai.createdAt, toAt),
            ),
          ),
        this.db
          .select({
            count: count(),
            userCount: countDistinct(kotae.createdBy),
          })
          .from(kotae)
          .innerJoin(odai, eq(kotae.odaiId, odai.id))
          .where(
            and(
              eq(odai.teamId, slackTeamId),
              gte(kotae.createdAt, fromAt),
              lt(kotae.createdAt, toAt),
            ),
          ),
        this.db
          .select({
            count: count(),
            userCount: countDistinct(vote.createdBy),
          })
          .from(vote)
          .innerJoin(odai, eq(vote.odaiId, odai.id))
          .where(
            and(
              eq(odai.teamId, slackTeamId),
              gte(vote.createdAt, fromAt),
              lt(vote.createdAt, toAt),
            ),
          ),
      ])

      return {
        kotaeCount: kotaeRows[0].count,
        kotaeUserCount: kotaeRows[0].userCount,
        odaiCount: odaiRows[0].count,
        voteCount: voteRows[0].count,
        voteUserCount: voteRows[0].userCount,
      }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  /**
   * 指定期間のお題を集計値つきで Postgres から取得する
   * 件数に関わらず往復回数を固定するため、集計は odaiId でまとめて引く
   */
  async getOdaiList({
    slackTeamId,
    from,
    to,
    limit,
  }: AdminOdaiListParams): Promise<AdminOdaiListItem[] | null> {
    try {
      const odaiRows = await this.db
        .select()
        .from(odai)
        .where(
          and(
            eq(odai.teamId, slackTeamId),
            gte(odai.createdAt, new Date(from).toISOString()),
            lt(odai.createdAt, new Date(to).toISOString()),
          ),
        )
        // NOTE: createdAt が同じお題があっても並びが揺れないよう id で確定させる
        .orderBy(desc(odai.createdAt), desc(odai.id))
        .limit(limit)

      if (!odaiRows.length) return []

      const odaiIds = odaiRows.map((o) => o.id)

      const [kotaeStats, voteStats, resultStats] = await Promise.all([
        this.db
          .select({
            odaiId: kotae.odaiId,
            count: count(),
            userCount: countDistinct(kotae.createdBy),
          })
          .from(kotae)
          .where(inArray(kotae.odaiId, odaiIds))
          .groupBy(kotae.odaiId),
        this.db
          .select({ odaiId: vote.odaiId, count: count() })
          .from(vote)
          .where(inArray(vote.odaiId, odaiIds))
          .groupBy(vote.odaiId),
        this.db
          .select({
            odaiId: result.odaiId,
            publishedAt: min(result.createdAt),
            topPoint: sql<
              number | null
            >`max(case when ${result.type} = 'point' and ${result.rank} = 1 then ${result.point} end)`,
          })
          .from(result)
          .where(inArray(result.odaiId, odaiIds))
          .groupBy(result.odaiId),
      ])

      return odaiRows.map((o) => {
        const kotaeStat = kotaeStats.find((k) => k.odaiId === o.id)
        const resultStat = resultStats.find((r) => r.odaiId === o.id)
        const status = o.status as OdaiStatus
        return {
          id: o.id,
          title: o.title,
          status,
          dueDate: new Date(o.dueDate).getTime(),
          createdAt: new Date(o.createdAt).getTime(),
          // NOTE: 結果行は status 更新より先に作られるため、発表済みになるまでは未発表として扱う
          publishedAt:
            status === 'finished' && resultStat?.publishedAt
              ? new Date(resultStat.publishedAt).getTime()
              : null,
          kotaeCount: kotaeStat?.count ?? 0,
          kotaeUserCount: kotaeStat?.userCount ?? 0,
          voteCount: voteStats.find((v) => v.odaiId === o.id)?.count ?? 0,
          topPoint:
            status === 'finished' ? (resultStat?.topPoint ?? null) : null,
        }
      })
    } catch (error) {
      console.error(error)
      return null
    }
  }
}
