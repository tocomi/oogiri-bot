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
import { AdminAvailableYearsParams } from './AdminAvailableYears'
import { AdminOdaiDetailParams } from './AdminOdaiDetail'
import { AdminOdaiListItem, AdminOdaiListParams } from './AdminOdaiList'
import {
  AdminOdaiDetailSource,
  AdminReadResult,
  AdminReportingRepository,
  AdminUserStatsSource,
} from './AdminReportingRepository'
import { AdminSummaryCounts } from './AdminSummary'
import {
  ADMIN_USER_MATRIX_ODAI_LIMIT,
  AdminUserMatrix,
  AdminUserMatrixParams,
} from './AdminUserMatrix'
import { AdminUserStatsParams } from './AdminUserStats'

type Db = typeof defaultDb

/**
 * お題の作成日時を日本時間の年に丸める式
 * createdAt は ISO 文字列の text 列のため、比較の前に timestamptz へ揃える
 */
const odaiCreatedYearInJst = sql<number>`extract(year from (${odai.createdAt})::timestamptz at time zone 'Asia/Tokyo')::int`

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
   * お題が 1 件以上ある年を Postgres から新しい順に取得する
   * 年の区切りは画面の日付表示と揃えるため、日本時間で判定する
   */
  async getAvailableYears({
    slackTeamId,
  }: AdminAvailableYearsParams): Promise<AdminReadResult<number[]>> {
    try {
      const rows = await this.db
        .select({ year: odaiCreatedYearInJst })
        .from(odai)
        .where(eq(odai.teamId, slackTeamId))
        .groupBy(odaiCreatedYearInJst)
        .orderBy(desc(odaiCreatedYearInJst))

      return { status: 'ok', value: rows.map((row) => Number(row.year)) }
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

  /**
   * 指定期間の回答数と投票数をユーザーごとに Postgres から取得する
   * ユーザー数が増えても往復回数を変えないため、集計は createdBy でまとめて引く
   */
  async getUserStats({
    slackTeamId,
    from,
    to,
  }: AdminUserStatsParams): Promise<AdminReadResult<AdminUserStatsSource>> {
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
            userId: kotae.createdBy,
            count: count(),
            odaiCount: countDistinct(kotae.odaiId),
          })
          .from(kotae)
          .innerJoin(odai, eq(kotae.odaiId, odai.id))
          .where(
            and(
              eq(odai.teamId, slackTeamId),
              gte(kotae.createdAt, fromAt),
              lt(kotae.createdAt, toAt),
            ),
          )
          .groupBy(kotae.createdBy),
        this.db
          .select({
            userId: vote.createdBy,
            count: count(),
            odaiCount: countDistinct(vote.odaiId),
          })
          .from(vote)
          .innerJoin(odai, eq(vote.odaiId, odai.id))
          .where(
            and(
              eq(odai.teamId, slackTeamId),
              gte(vote.createdAt, fromAt),
              lt(vote.createdAt, toAt),
            ),
          )
          .groupBy(vote.createdBy),
      ])

      // NOTE: 回答だけの人も投票だけの人も一覧に出すため、両方の集計結果から母集団を作る
      const userIds = [
        ...new Set([
          ...kotaeRows.map((row) => row.userId),
          ...voteRows.map((row) => row.userId),
        ]),
      ]

      const users = userIds.map((userId) => {
        const kotaeStat = kotaeRows.find((row) => row.userId === userId)
        const voteStat = voteRows.find((row) => row.userId === userId)
        return {
          userId,
          kotaeCount: kotaeStat?.count ?? 0,
          kotaeOdaiCount: kotaeStat?.odaiCount ?? 0,
          voteCount: voteStat?.count ?? 0,
          voteOdaiCount: voteStat?.odaiCount ?? 0,
        }
      })

      return {
        status: 'ok',
        value: { odaiCount: odaiRows[0].count, users },
      }
    } catch (error) {
      console.error(error)
      return { status: 'error' }
    }
  }

  /**
   * 指定期間のお題 × ユーザーの回答数と投票数を Postgres から取得する
   * 列が増えすぎないよう直近のお題だけに絞り、絞る前の総数も併せて返す
   */
  async getUserMatrixSource({
    slackTeamId,
    from,
    to,
  }: AdminUserMatrixParams): Promise<AdminReadResult<AdminUserMatrix>> {
    const inPeriod = and(
      eq(odai.teamId, slackTeamId),
      gte(odai.createdAt, new Date(from).toISOString()),
      lt(odai.createdAt, new Date(to).toISOString()),
    )

    try {
      const [odaiRows, totalRows] = await Promise.all([
        this.db
          .select({
            id: odai.id,
            title: odai.title,
            createdAt: odai.createdAt,
          })
          .from(odai)
          .where(inPeriod)
          // NOTE: createdAt が同じお題があっても並びが揺れないよう id で確定させる
          .orderBy(desc(odai.createdAt), desc(odai.id))
          .limit(ADMIN_USER_MATRIX_ODAI_LIMIT),
        this.db.select({ count: count() }).from(odai).where(inPeriod),
      ])

      const totalOdaiCount = totalRows[0].count

      if (!odaiRows.length) {
        return {
          status: 'ok',
          value: { odaiList: [], rows: [], totalOdaiCount },
        }
      }

      const odaiIds = odaiRows.map((row) => row.id)

      const [kotaeRows, voteRows] = await Promise.all([
        this.db
          .select({
            odaiId: kotae.odaiId,
            userId: kotae.createdBy,
            count: count(),
          })
          .from(kotae)
          .where(inArray(kotae.odaiId, odaiIds))
          .groupBy(kotae.odaiId, kotae.createdBy),
        this.db
          .select({
            odaiId: vote.odaiId,
            userId: vote.createdBy,
            count: count(),
          })
          .from(vote)
          .where(inArray(vote.odaiId, odaiIds))
          .groupBy(vote.odaiId, vote.createdBy),
      ])

      // NOTE: セル数はお題数 × ユーザー数まで膨らむため、走査ではなく key 引きで組む
      const toCellKey = (odaiId: string, userId: string) =>
        `${odaiId} ${userId}`
      const kotaeCells = new Map(
        kotaeRows.map((row) => [toCellKey(row.odaiId, row.userId), row.count]),
      )
      const voteCells = new Map(
        voteRows.map((row) => [toCellKey(row.odaiId, row.userId), row.count]),
      )

      // 画面は左を古いお題として並べるため、取得時の新しい順をここで反転させる
      const odaiList = odaiRows
        .map((row) => ({
          id: row.id,
          title: row.title,
          createdAt: new Date(row.createdAt).getTime(),
        }))
        .reverse()

      const userIds = [
        ...new Set([
          ...kotaeRows.map((row) => row.userId),
          ...voteRows.map((row) => row.userId),
        ]),
      ]

      const rows = userIds.map((userId) => ({
        userId,
        kotaeCounts: odaiList.map(
          (o) => kotaeCells.get(toCellKey(o.id, userId)) ?? 0,
        ),
        voteCounts: odaiList.map(
          (o) => voteCells.get(toCellKey(o.id, userId)) ?? 0,
        ),
      }))

      return { status: 'ok', value: { odaiList, rows, totalOdaiCount } }
    } catch (error) {
      console.error(error)
      return { status: 'error' }
    }
  }
}
