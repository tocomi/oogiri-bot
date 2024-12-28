import cors from 'cors'
import express from 'express'
import * as functions from 'firebase-functions'
import { ApiError, hasError, IllegalArgumentError } from './api/Error'
import { IpponRepository, IpponRepositoryImpl } from './ippon/IpponRepository'
import { IpponService, IpponServiceImpl } from './ippon/IpponService'
import {
  KotaeOfCurrentOdaiParams,
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
import { VoteCountByUserParams, VoteCountParams, VoteCreateRequest } from './vote/Vote'
import { VoteFirestoreRepositoryImpl } from './vote/VoteFirestoreRepositoryImpl'
import { VotePostgresRepositoryImpl } from './vote/VotePostgresRepositoryImpl'
import { VoteRepository } from './vote/VoteRepository'
import { VoteService, VoteServiceImpl } from './vote/VoteService'

const app = express()
app.use(cors({ origin: true }))

app.use((req, _res, next) => {
  console.log(`endpoint: ${req.url}`)
  console.log(`params: ${JSON.stringify(req.body)}`)
  next()
})

const odaiRepository: OdaiRepository = new OdaiFirestoreRepositoryImpl()
const odaiNewRepository: OdaiRepository = new OdaiPostgresRepositoryImpl()
const odaiService: OdaiService = new OdaiServiceImpl(odaiRepository, odaiNewRepository)
const kotaeRepository: KotaeRepository = new KotaeFirestoreRepositoryImpl()
const kotaeNewRepository: KotaeRepository = new KotaePostgresRepositoryImpl()
const kotaeService: KotaeService = new KotaeServiceImpl(
  kotaeRepository,
  kotaeNewRepository,
  odaiService
)
const ipponRepository: IpponRepository = new IpponRepositoryImpl()
const ipponService: IpponService = new IpponServiceImpl(ipponRepository, kotaeService, odaiService)
const voteRepository: VoteRepository = new VoteFirestoreRepositoryImpl()
const voteNewRepository: VoteRepository = new VotePostgresRepositoryImpl()
const voteService: VoteService = new VoteServiceImpl(
  voteRepository,
  voteNewRepository,
  odaiService,
  kotaeService,
  ipponService
)

const errorResponse = (res: express.Response, error: ApiError) => {
  console.log(`ERROR: ${error.message}`)
  return res.status(error.status).send({ error: true, message: error.message })
}

const sendResponse = (res: express.Response, result: Record<string, unknown> | unknown[]) => {
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

  const putResult = await odaiService.finish({
    slackTeamId: params.slackTeamId,
    kotaeList: result.kotaeList,
  })
  if (hasError(putResult)) {
    return errorResponse(res, putResult)
  }

  return sendResponse(res, {
    odaiTitle: result.odaiTitle,
    odaiImageUrl: result.odaiImageUrl,
    kotaeList: result.kotaeList,
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

  return sendResponse(res, { odaiTitle: result.odaiTitle, kotaeList: result.kotaeList })
})

app.post('/kotae/vote', async (req: express.Request, res) => {
  const params = req.body as VoteCreateRequest
  if (!params.slackTeamId || !params.content || !params.votedBy || !params.rank) {
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

functions.setGlobalOptions({ region: 'asia-northeast1' })

exports.api = functions.https.onRequest(app)
