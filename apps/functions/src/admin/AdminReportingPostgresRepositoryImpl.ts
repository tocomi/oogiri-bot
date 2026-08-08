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
} from 'drizzle-orm'

import { SlackPeriodParams } from '../api/Api'
import { db as defaultDb } from '../db/client'
import { kotae, odai, result, vote } from '../db/schema'
import { OdaiStatus } from '../odai/Odai'
import { AdminOdaiDetailParams } from './AdminOdaiDetail'
import { AdminOdaiListItem, AdminOdaiListParams } from './AdminOdaiList'
import {
  AdminOdaiDetailSource,
  AdminReadResult,
  AdminReportingRepository,
} from './AdminReportingRepository'
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
  }: SlackPeriodParams): Promise<AdminReadResult<AdminSummaryCounts>> {
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
        status: 'ok',
        value: {
          kotaeCount: kotaeRows[0].count,
          kotaeUserCount: kotaeRows[0].userCount,
          odaiCount: odaiRows[0].count,
          voteCount: voteRows[0].count,
          voteUserCount: voteRows[0].userCount,
        },
      }
    } catch (error) {
      console.error(error)
      return { status: 'error' }
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
  }: AdminOdaiListParams): Promise<AdminReadResult<AdminOdaiListItem[]>> {
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

      if (!odaiRows.length) return { status: 'ok', value: [] }

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
          .select({
            odaiId: vote.odaiId,
            count: count(),
            userCount: countDistinct(vote.createdBy),
          })
          .from(vote)
          .where(inArray(vote.odaiId, odaiIds))
          .groupBy(vote.odaiId),
        this.db
          .select({
            odaiId: result.odaiId,
            publishedAt: min(result.createdAt),
          })
          .from(result)
          .where(inArray(result.odaiId, odaiIds))
          .groupBy(result.odaiId),
      ])

      const items = odaiRows.map((o) => {
        const kotaeStat = kotaeStats.find((k) => k.odaiId === o.id)
        const voteStat = voteStats.find((v) => v.odaiId === o.id)
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
          voteCount: voteStat?.count ?? 0,
          voteUserCount: voteStat?.userCount ?? 0,
        }
      })

      return { status: 'ok', value: items }
    } catch (error) {
      console.error(error)
      return { status: 'error' }
    }
  }

  /**
   * 1 件のお題の集計と順位の材料を Postgres から取得する
   * 順位の算出は service 側で行うため、ここでは素材だけを返す
   */
  async getOdaiDetailSource({
    slackTeamId,
    odaiId,
  }: AdminOdaiDetailParams): Promise<AdminReadResult<AdminOdaiDetailSource>> {
    try {
      const odaiRows = await this.db
        .select()
        .from(odai)
        .where(and(eq(odai.id, odaiId), eq(odai.teamId, slackTeamId)))
        .limit(1)

      const odaiRow = odaiRows[0]
      if (!odaiRow) return { status: 'notFound' }

      const status = odaiRow.status as OdaiStatus

      const [kotaeRows, voteRows, resultRows] = await Promise.all([
        this.db.select().from(kotae).where(eq(kotae.odaiId, odaiId)),
        this.db
          .select({
            kotaeId: vote.kotaeId,
            rank: vote.rank,
            createdBy: vote.createdBy,
          })
          .from(vote)
          .where(eq(vote.odaiId, odaiId)),
        // NOTE: 結果行は status 更新より先に作られるため、発表済みになるまでは読まない
        status === 'finished'
          ? this.db.select().from(result).where(eq(result.odaiId, odaiId))
          : [],
      ])

      const kotaeList = kotaeRows.map((k) => {
        const kotaeVotes = voteRows.filter((v) => v.kotaeId === k.id)
        return {
          id: k.id,
          content: k.content,
          createdBy: k.createdBy,
          votedCount: kotaeVotes.length,
          votedFirstCount: kotaeVotes.filter((v) => v.rank === 1).length,
          votedSecondCount: kotaeVotes.filter((v) => v.rank === 2).length,
          votedThirdCount: kotaeVotes.filter((v) => v.rank === 3).length,
          createdAt: new Date(k.createdAt).getTime(),
        }
      })

      const findKotae = (kotaeId: string) =>
        kotaeRows.find((k) => k.id === kotaeId)

      const publishedResult = resultRows.length
        ? {
            pointStats: resultRows
              .filter((r) => r.type === 'point')
              .map((r) => ({
                type: 'point' as const,
                kotaeId: r.kotaeId,
                kotaeContent: findKotae(r.kotaeId)?.content ?? '',
                userName: findKotae(r.kotaeId)?.createdBy ?? '',
                point: r.point,
                rank: r.rank as 1 | 2 | 3,
                votedFirstCount: voteRows.filter(
                  (v) => v.kotaeId === r.kotaeId && v.rank === 1,
                ).length,
                votedSecondCount: voteRows.filter(
                  (v) => v.kotaeId === r.kotaeId && v.rank === 2,
                ).length,
                votedThirdCount: voteRows.filter(
                  (v) => v.kotaeId === r.kotaeId && v.rank === 3,
                ).length,
              })),
            countStats: resultRows
              .filter((r) => r.type === 'count')
              .map((r) => ({
                type: 'count' as const,
                kotaeId: r.kotaeId,
                kotaeContent: findKotae(r.kotaeId)?.content ?? '',
                userName: findKotae(r.kotaeId)?.createdBy ?? '',
                rank: r.rank as 1 | 2 | 3,
                votedCount: r.point,
              })),
            // NOTE: 結果は発表時に一括で作られるため、最も古い行の作成日時が発表日時になる
            publishedAt: Math.min(
              ...resultRows.map((r) => new Date(r.createdAt).getTime()),
            ),
          }
        : null

      return {
        status: 'ok',
        value: {
          kotaeList,
          odai: {
            createdAt: new Date(odaiRow.createdAt).getTime(),
            dueDate: new Date(odaiRow.dueDate).getTime(),
            id: odaiRow.id,
            status,
            title: odaiRow.title,
          },
          publishedResult,
          voteUserCount: new Set(voteRows.map((v) => v.createdBy)).size,
        },
      }
    } catch (error) {
      console.error(error)
      return { status: 'error' }
    }
  }
}
