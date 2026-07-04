import type * as functions from 'firebase-functions'

import { Hono } from 'hono'
import { z } from 'zod'

import { hasError, IllegalArgumentError } from '../api/Error'
import { KotaePostgresRepositoryImpl } from '../kotae/KotaePostgresRepositoryImpl'
import { OdaiPostgresRepositoryImpl } from '../odai/OdaiPostgresRepositoryImpl'
import { VotePostgresRepositoryImpl } from '../vote/VotePostgresRepositoryImpl'
import { AdminActiveOdaiServiceImpl } from './AdminActiveOdaiService'
import { AdminDashboardMetricsServiceImpl } from './AdminDashboardMetricsService'

type AdminApiHandler = Parameters<typeof functions.https.onRequest>[0]
type AdminApiRequest = Parameters<AdminApiHandler>[0]

const adminDashboardMetricsQuerySchema = z.object({
  /** 集計対象の Slack チーム ID */
  slackTeamId: z.string().min(1),
})

const adminDashboardMetricsService = new AdminDashboardMetricsServiceImpl({
  kotaeRepository: new KotaePostgresRepositoryImpl(),
  odaiRepository: new OdaiPostgresRepositoryImpl(),
  voteRepository: new VotePostgresRepositoryImpl(),
})

const adminActiveOdaiService = new AdminActiveOdaiServiceImpl({
  kotaeRepository: new KotaePostgresRepositoryImpl(),
  odaiRepository: new OdaiPostgresRepositoryImpl(),
  voteRepository: new VotePostgresRepositoryImpl(),
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
