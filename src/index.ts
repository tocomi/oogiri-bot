import { App, ExpressReceiver } from '@slack/bolt'
import cors from 'cors'
import express from 'express'
import * as functions from 'firebase-functions'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { ApiError, hasError, IllegalArgumentError } from './api/Error'
import { config } from './config'
import {
  KotaeOfCurrentOdaiParams,
  KotaePersonalCommentaryParams,
  KotaePersonalResultParams,
  KotaePostRequestParams,
} from './kotae/Kotae'
import { KotaeFirestoreRepositoryImpl } from './kotae/KotaeFirestoreRepositoryImpl'
import { KotaePostgresRepositoryImpl } from './kotae/KotaePostgresRepositoryImpl'
import { KotaeRepository } from './kotae/KotaeRepository'
import { KotaeService, KotaeServiceImpl } from './kotae/KotaeService'
import {
  OdaiCurrentParams,
  OdaiGetAllResultsParams,
  OdaiPostRequestParams,
  OdaiPutStatusParams,
} from './odai/Odai'
import { OdaiFirestoreRepositoryImpl } from './odai/OdaiFirestoreRepositoryImpl'
import { OdaiPostgresRepositoryImpl } from './odai/OdaiPostgresRepositoryImpl'
import { OdaiRepository } from './odai/OdaiRepository'
import { OdaiService, OdaiServiceImpl } from './odai/OdaiService'
import { inspireNewOdai } from './scheduler/inspireNewOdai'
import { notifyCount } from './scheduler/notifyCount'
import { getActionLabel } from './slack/getActionLabel'
import { registerHandlers } from './slack/handlers/registerHandlers'
import {
  VoteCountByUserParams,
  VoteCountParams,
  VoteCreateRequest,
} from './vote/Vote'
import { VoteFirestoreRepositoryImpl } from './vote/VoteFirestoreRepositoryImpl'
import { VotePostgresRepositoryImpl } from './vote/VotePostgresRepositoryImpl'
import { VoteRepository } from './vote/VoteRepository'
import { VoteService, VoteServiceImpl } from './vote/VoteService'

// NOTE: Bolt の ExpressReceiver を作成し既存の Express app と統合する
const receiver = new ExpressReceiver({
  signingSecret: config.slack.signingSecret,
  endpoints: '/slack/events',
})

const boltApp = new App({
  token: config.slack.botToken,
  receiver,
  // NOTE: Firebase Functions のコールドスタート対策
  // ack() を呼び出した時点で即座に Slack へレスポンスを返し、その後処理を継続する
  processBeforeResponse: false,
})

boltApp.use(async ({ body, next }) => {
  console.log(`[slack] triggered: ${getActionLabel(body as Record<string, unknown>)}`)
  await next()
})

const app = receiver.app
app.use(cors({ origin: true }))

app.use((req, _res, next) => {
  console.log(`endpoint: ${req.url}`)
  console.log(`params: ${JSON.stringify(req.body)}`)
  next()
})

const odaiRepository: OdaiRepository = new OdaiFirestoreRepositoryImpl()
const odaiNewRepository: OdaiRepository = new OdaiPostgresRepositoryImpl()
const odaiService: OdaiService = new OdaiServiceImpl(
  odaiRepository,
  odaiNewRepository,
)
const kotaeRepository: KotaeRepository = new KotaeFirestoreRepositoryImpl()
const kotaeNewRepository: KotaeRepository = new KotaePostgresRepositoryImpl()
const kotaeService: KotaeService = new KotaeServiceImpl(
  kotaeRepository,
  kotaeNewRepository,
  odaiService,
)
const voteRepository: VoteRepository = new VoteFirestoreRepositoryImpl()
const voteNewRepository: VoteRepository = new VotePostgresRepositoryImpl()
const voteService: VoteService = new VoteServiceImpl(
  voteRepository,
  voteNewRepository,
  odaiService,
  kotaeService,
)

const errorResponse = (res: express.Response, error: ApiError) => {
  console.log(`ERROR: ${error.message}`)
  return res.status(error.status).send({ error: true, message: error.message })
}

const sendResponse = (
  res: express.Response,
  result: Record<string, unknown> | unknown[],
) => {
  console.log(`response: ${JSON.stringify(result)}`)
  return res.send(result)
}

app.post('/odai', async (req: express.Request, res) => {
  const params = req.body as OdaiPostRequestParams
  if (!params.slackTeamId || !params.title || !params.createdBy) {
    return errorResponse(res, IllegalArgumentError)
  }

  const result = await odaiService.create(params)
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  return sendResponse(res, { error: false })
})

app.get('/odai/current', async (req: express.Request, res) => {
  const params = req.query as OdaiCurrentParams
  if (!params.slackTeamId) {
    return errorResponse(res, IllegalArgumentError)
  }

  const result = await odaiService.getCurrent(params)
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  return sendResponse(res, { odai: result })
})

app.post('/odai/start-voting', async (req: express.Request, res) => {
  const params = req.body as OdaiPutStatusParams
  if (!params.slackTeamId) {
    return errorResponse(res, IllegalArgumentError)
  }

  const result = await kotaeService.getAllOfCurrentOdai(params)
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  const putResult = await odaiService.startVoting(params)
  if (hasError(putResult)) {
    return errorResponse(res, putResult)
  }

  return sendResponse(res, {
    odaiTitle: result.odaiTitle,
    odaiImageUrl: result.odaiImageUrl,
    kotaeList: result.kotaeList,
  })
})

app.post('/odai/finish', async (req: express.Request, res) => {
  const params = req.body as OdaiPutStatusParams
  if (!params.slackTeamId) {
    return errorResponse(res, IllegalArgumentError)
  }

  const result = await kotaeService.getAllOfCurrentOdai(params)
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  const finishResult = await odaiService.finish({
    slackTeamId: params.slackTeamId,
    kotaeList: result.kotaeList,
  })
  if (hasError(finishResult)) {
    return errorResponse(res, finishResult)
  }

  return sendResponse(res, {
    odaiTitle: result.odaiTitle,
    odaiImageUrl: result.odaiImageUrl,
    kotaeList: result.kotaeList,
    aiCommentary: finishResult.aiCommentary,
  })
})

app.post('/kotae', async (req: express.Request, res) => {
  const params = req.body as KotaePostRequestParams
  if (!params.slackTeamId || !params.content || !params.createdBy) {
    return errorResponse(res, IllegalArgumentError)
  }

  const result = await kotaeService.create(params)
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  return sendResponse(res, { error: false })
})

app.get('/kotae/current', async (req: express.Request, res) => {
  const params = req.query as KotaeOfCurrentOdaiParams
  if (!params.slackTeamId) {
    return errorResponse(res, IllegalArgumentError)
  }

  const result = await kotaeService.getAllOfCurrentOdai(params)
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  return sendResponse(res, { ...result })
})

app.get('/kotae/personal-result', async (req: express.Request, res) => {
  const params = req.query as KotaePersonalResultParams
  if (!params.slackTeamId || !params.userId) {
    return errorResponse(res, IllegalArgumentError)
  }

  const result = await kotaeService.getPersonalResult(params)
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  return sendResponse(res, {
    odaiTitle: result.odaiTitle,
    kotaeList: result.kotaeList,
  })
})

app.get('/kotae/personal-commentary', async (req: express.Request, res) => {
  const params = req.query as KotaePersonalCommentaryParams
  if (!params.slackTeamId || !params.userId) {
    return errorResponse(res, IllegalArgumentError)
  }

  const result = await kotaeService.getPersonalCommentary(params)
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  return sendResponse(res, result)
})

app.post('/kotae/vote', async (req: express.Request, res) => {
  const params = req.body as VoteCreateRequest
  if (
    !params.slackTeamId ||
    !params.content ||
    !params.votedBy ||
    !params.rank
  ) {
    return errorResponse(res, IllegalArgumentError)
  }
  const result = await voteService.create(params)
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  return sendResponse(res, { ...result })
})

app.get('/vote/count', async (req: express.Request, res) => {
  const params = req.query as VoteCountParams
  if (!params.slackTeamId) {
    return errorResponse(res, IllegalArgumentError)
  }

  const result = await voteService.getVoteCount(params)
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  return sendResponse(res, { ...result })
})

app.get('/vote/my-fans', async (req: express.Request, res) => {
  const params = req.query as VoteCountByUserParams
  if (!params.slackTeamId || !params.userId) {
    return errorResponse(res, IllegalArgumentError)
  }

  const result = await voteService.getTotalVoteCountByUser(params)

  return sendResponse(res, { ...result })
})

app.get('/stats', async (req: express.Request, res) => {
  const params = req.query as OdaiGetAllResultsParams
  if (!params.slackTeamId) {
    return errorResponse(res, IllegalArgumentError)
  }

  const result = await odaiService.getAllResults(params)
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  return sendResponse(res, result)
})

app.get('/stats/:odaiId', async (req: express.Request, res) => {
  const { slackTeamId } = req.query as OdaiGetAllResultsParams
  if (!slackTeamId) {
    return errorResponse(res, IllegalArgumentError)
  }

  const { odaiId } = req.params
  if (!odaiId) {
    return errorResponse(res, IllegalArgumentError)
  }

  const result = await odaiService.getResult({ slackTeamId, odaiId })
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  return sendResponse(res, { ...result })
})

// NOTE: Slack イベントハンドラーを登録
registerHandlers({
  app: boltApp,
  odaiService,
  kotaeService,
  voteService,
})

functions.setGlobalOptions({ region: 'asia-northeast1' })

exports.api = functions.https.onRequest(app)

// NOTE: 毎日 9 時にカウント通知
exports.scheduledNotifyCount = onSchedule(
  { schedule: '0 9 * * *', timeZone: 'Asia/Tokyo' },
  async () => {
    await notifyCount({ kotaeService, voteService })
  },
)

// NOTE: 毎日 19:30 にカウント通知
exports.scheduledNotifyCountEvening = onSchedule(
  { schedule: '30 19 * * *', timeZone: 'Asia/Tokyo' },
  async () => {
    await notifyCount({ kotaeService, voteService })
  },
)

// NOTE: 毎週月曜 9 時に新お題の呼びかけ
exports.scheduledInspireNewOdai = onSchedule(
  { schedule: '0 9 * * 1', timeZone: 'Asia/Tokyo' },
  async () => {
    await inspireNewOdai({ odaiService })
  },
)
