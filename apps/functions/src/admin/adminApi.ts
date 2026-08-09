import type * as functions from 'firebase-functions'

import { Hono } from 'hono'
import { z } from 'zod'

import { hasError, IllegalArgumentError } from '../api/Error'
import { AdminAvailableYearsServiceImpl } from './AdminAvailableYearsService'
import { AdminOdaiDetailServiceImpl } from './AdminOdaiDetailService'
import { AdminOdaiListServiceImpl } from './AdminOdaiListService'
import { AdminReportingPostgresRepositoryImpl } from './AdminReportingPostgresRepositoryImpl'
import { AdminSummaryServiceImpl } from './AdminSummaryService'
import { AdminUserMatrixServiceImpl } from './AdminUserMatrixService'
import { SlackAdminUserNameResolver } from './AdminUserNameResolver'
import { AdminUserStatsServiceImpl } from './AdminUserStatsService'

type AdminApiHandler = Parameters<typeof functions.https.onRequest>[0]
type AdminApiRequest = Parameters<AdminApiHandler>[0]

const reportingRepository = new AdminReportingPostgresRepositoryImpl()

const slackTeamIdSchema = z.string().min(1)

/** 期間を受け取るエンドポイントで共通の検証 */
const periodSchema = z
  .object({
    /** 集計期間の開始（Unix ミリ秒） */
    from: z.coerce.number().int().nonnegative(),
    /** 集計期間の終了（Unix ミリ秒） */
    to: z.coerce.number().int().nonnegative(),
  })
  .refine(({ from, to }) => from < to, {
    message: 'from must be earlier than to',
  })

/** チーム ID だけを受け取るエンドポイントで共通の検証 */
const adminTeamQuerySchema = z.object({
  slackTeamId: slackTeamIdSchema,
})

const adminSummaryQuerySchema = z
  .object({ slackTeamId: slackTeamIdSchema })
  .and(periodSchema)

const adminOdaiListQuerySchema = z
  .object({ slackTeamId: slackTeamIdSchema })
  .and(periodSchema)

/** ユーザー別集計は一覧もヒートマップも同じ絞り込みで引く */
const adminUserQuerySchema = z
  .object({ slackTeamId: slackTeamIdSchema })
  .and(periodSchema)

const adminSummaryService = new AdminSummaryServiceImpl({
  reportingRepository,
})

const adminOdaiListService = new AdminOdaiListServiceImpl({
  reportingRepository,
})

const adminAvailableYearsService = new AdminAvailableYearsServiceImpl({
  reportingRepository,
})

// NOTE: 解決した表示名をインスタンス内に溜めるため、Slack への問い合わせを減らせるよう共有する
const userNameResolver = new SlackAdminUserNameResolver()

const adminOdaiDetailService = new AdminOdaiDetailServiceImpl({
  reportingRepository,
  userNameResolver,
})

const adminUserStatsService = new AdminUserStatsServiceImpl({
  reportingRepository,
  userNameResolver,
})

const adminUserMatrixService = new AdminUserMatrixServiceImpl({
  reportingRepository,
})

/**
 * Firebase Functions の HTTP request headers を Hono が扱う Web Headers に変換する
 */
const createHeaders = (req: AdminApiRequest) => {
  const headers = new Headers()

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item)
      }
      continue
    }

    if (value) {
      headers.set(key, value)
    }
  }

  return headers
}

/**
 * Hono は Web Request を受け取るため、Firebase/Express request body を BodyInit に寄せる
 */
const createRequestBody = (req: AdminApiRequest): BodyInit | undefined => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined
  }

  if (req.rawBody) {
    return new Uint8Array(req.rawBody)
  }

  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    return Buffer.isBuffer(req.body) ? new Uint8Array(req.body) : req.body
  }

  if (req.body) {
    return JSON.stringify(req.body)
  }

  return undefined
}

export const adminApp = new Hono()

adminApp.get('/health', (c) => {
  return c.json({ ok: true, service: 'admin-api' })
})

adminApp.get('/summary', async (c) => {
  const query = adminSummaryQuerySchema.safeParse({
    from: c.req.query('from'),
    slackTeamId: c.req.query('slackTeamId'),
    to: c.req.query('to'),
  })
  if (!query.success) {
    return c.json(IllegalArgumentError, IllegalArgumentError.status)
  }

  const summary = await adminSummaryService.get(query.data)
  if (hasError(summary)) {
    return c.json(summary, summary.status)
  }

  return c.json(summary)
})

adminApp.get('/years', async (c) => {
  const query = adminTeamQuerySchema.safeParse({
    slackTeamId: c.req.query('slackTeamId'),
  })
  if (!query.success) {
    return c.json(IllegalArgumentError, IllegalArgumentError.status)
  }

  const years = await adminAvailableYearsService.get(query.data)
  if (hasError(years)) {
    return c.json(years, years.status)
  }

  return c.json(years)
})

adminApp.get('/odai', async (c) => {
  const query = adminOdaiListQuerySchema.safeParse({
    from: c.req.query('from'),
    slackTeamId: c.req.query('slackTeamId'),
    to: c.req.query('to'),
  })
  if (!query.success) {
    return c.json(IllegalArgumentError, IllegalArgumentError.status)
  }

  const list = await adminOdaiListService.get(query.data)
  if (hasError(list)) {
    return c.json(list, list.status)
  }

  return c.json(list)
})

adminApp.get('/users', async (c) => {
  const query = adminUserQuerySchema.safeParse({
    from: c.req.query('from'),
    slackTeamId: c.req.query('slackTeamId'),
    to: c.req.query('to'),
  })
  if (!query.success) {
    return c.json(IllegalArgumentError, IllegalArgumentError.status)
  }

  const stats = await adminUserStatsService.get(query.data)
  if (hasError(stats)) {
    return c.json(stats, stats.status)
  }

  return c.json(stats)
})

adminApp.get('/users/matrix', async (c) => {
  const query = adminUserQuerySchema.safeParse({
    from: c.req.query('from'),
    slackTeamId: c.req.query('slackTeamId'),
    to: c.req.query('to'),
  })
  if (!query.success) {
    return c.json(IllegalArgumentError, IllegalArgumentError.status)
  }

  const matrix = await adminUserMatrixService.get(query.data)
  if (hasError(matrix)) {
    return c.json(matrix, matrix.status)
  }

  return c.json(matrix)
})

adminApp.get('/odai/:odaiId', async (c) => {
  const query = adminTeamQuerySchema.safeParse({
    slackTeamId: c.req.query('slackTeamId'),
  })
  if (!query.success) {
    return c.json(IllegalArgumentError, IllegalArgumentError.status)
  }

  const detail = await adminOdaiDetailService.get({
    odaiId: c.req.param('odaiId'),
    slackTeamId: query.data.slackTeamId,
  })
  if (hasError(detail)) {
    return c.json(detail, detail.status)
  }

  return c.json(detail)
})

/**
 * Firebase Functions の handler から Hono の fetch API へ橋渡しする
 */
export const handleAdminApiRequest: AdminApiHandler = async (req, res) => {
  const host = req.get('host') ?? 'localhost'
  const requestUrl = new URL(req.originalUrl ?? req.url, `https://${host}`)

  const response = await adminApp.fetch(
    new Request(requestUrl.toString(), {
      body: createRequestBody(req),
      headers: createHeaders(req),
      method: req.method,
    }),
  )

  res.status(response.status)
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  res.send(Buffer.from(await response.arrayBuffer()))
}
