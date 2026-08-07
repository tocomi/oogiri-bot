import type * as functions from 'firebase-functions'

import { Hono } from 'hono'
import { z } from 'zod'

import { hasError, IllegalArgumentError } from '../api/Error'
import { KotaePostgresRepositoryImpl } from '../kotae/KotaePostgresRepositoryImpl'
import { OdaiPostgresRepositoryImpl } from '../odai/OdaiPostgresRepositoryImpl'
import { VotePostgresRepositoryImpl } from '../vote/VotePostgresRepositoryImpl'
import { AdminActiveOdaiServiceImpl } from './AdminActiveOdaiService'
import { AdminDashboardMetricsServiceImpl } from './AdminDashboardMetricsService'
import { AdminOdaiDetailServiceImpl } from './AdminOdaiDetailService'
import { AdminOdaiListServiceImpl } from './AdminOdaiListService'
import { AdminReportingPostgresRepositoryImpl } from './AdminReportingPostgresRepositoryImpl'
import { AdminSummaryServiceImpl } from './AdminSummaryService'
import { SlackAdminUserNameResolver } from './AdminUserNameResolver'

type AdminApiHandler = Parameters<typeof functions.https.onRequest>[0]
type AdminApiRequest = Parameters<AdminApiHandler>[0]

const kotaeRepository = new KotaePostgresRepositoryImpl()
const odaiRepository = new OdaiPostgresRepositoryImpl()
const voteRepository = new VotePostgresRepositoryImpl()
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

const adminDashboardMetricsQuerySchema = z.object({
  slackTeamId: slackTeamIdSchema,
})

const adminSummaryQuerySchema = z
  .object({ slackTeamId: slackTeamIdSchema })
  .and(periodSchema)

const adminOdaiListQuerySchema = z
  .object({
    slackTeamId: slackTeamIdSchema,
    /** 取得する最大件数 */
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .and(periodSchema)

const adminDashboardMetricsService = new AdminDashboardMetricsServiceImpl({
  kotaeRepository,
  odaiRepository,
  voteRepository,
})

const adminActiveOdaiService = new AdminActiveOdaiServiceImpl({
  kotaeRepository,
  odaiRepository,
  voteRepository,
})

const adminSummaryService = new AdminSummaryServiceImpl({
  reportingRepository,
})

const adminOdaiListService = new AdminOdaiListServiceImpl({
  reportingRepository,
})

const adminOdaiDetailService = new AdminOdaiDetailServiceImpl({
  kotaeRepository,
  odaiRepository,
  userNameResolver: new SlackAdminUserNameResolver(),
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

adminApp.get('/dashboard/metrics', async (c) => {
  const query = adminDashboardMetricsQuerySchema.safeParse({
    slackTeamId: c.req.query('slackTeamId'),
  })
  if (!query.success) {
    return c.json(IllegalArgumentError, IllegalArgumentError.status)
  }

  const metrics = await adminDashboardMetricsService.get(query.data)
  if (hasError(metrics)) {
    return c.json(metrics, metrics.status)
  }

  return c.json(metrics)
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

adminApp.get('/odai', async (c) => {
  const query = adminOdaiListQuerySchema.safeParse({
    from: c.req.query('from'),
    limit: c.req.query('limit'),
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

adminApp.get('/odai/:odaiId', async (c) => {
  const query = adminDashboardMetricsQuerySchema.safeParse({
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

adminApp.get('/dashboard/active-odai', async (c) => {
  const query = adminDashboardMetricsQuerySchema.safeParse({
    slackTeamId: c.req.query('slackTeamId'),
  })
  if (!query.success) {
    return c.json(IllegalArgumentError, IllegalArgumentError.status)
  }

  const overview = await adminActiveOdaiService.get(query.data)
  if (hasError(overview)) {
    return c.json(overview, overview.status)
  }

  return c.json(overview)
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
