import * as functions from 'firebase-functions'
import * as express from 'express'
import * as cors from 'cors'
import { OdaiCurrentParams, OdaiPostRequestParams, OdaiPutStatusParams } from './odai/Odai'
import { OdaiRepository, OdaiRepositoryImpl } from './odai/OdaiRepository'
import { OdaiService, OdaiServiceImpl } from './odai/OdaiService'
import {
  KotaeOfCurrentOdaiParams,
  KotaePersonalResultParams,
  KotaePostRequestParams,
} from './kotae/Kotae'
import { KotaeRepository, KotaeRepositoryImpl } from './kotae/KotaeRepository'
import { KotaeService, KotaeServiceImpl } from './kotae/KotaeService'
import { VoteRepository, VoteRepositoryImpl } from './vote/VoteRepository'
import { VoteService, VoteServiceImpl } from './vote/VoteService'
import { VoteCountByUserParams, VoteCountParams, VoteRequestParams } from './vote/Vote'
import { ApiError, hasError, IllegalArgumentError } from './api/Error'

const REGION = 'asia-northeast1'

const app = express()
app.use(cors({ origin: true }))

app.use((req, _res, next) => {
  console.log(`endpoint: ${req.url}`)
  console.log(`params: ${JSON.stringify(req.body)}`)
  next()
})

const odaiRepository: OdaiRepository = new OdaiRepositoryImpl()
const odaiService: OdaiService = new OdaiServiceImpl(odaiRepository)
const kotaeRepository: KotaeRepository = new KotaeRepositoryImpl()
const kotaeService: KotaeService = new KotaeServiceImpl(kotaeRepository, odaiService)
const voteRepository: VoteRepository = new VoteRepositoryImpl()
const voteService: VoteService = new VoteServiceImpl(voteRepository, odaiService, kotaeService)

const errorResponse = (res: express.Response, error: ApiError) => {
  console.log(`ERROR: ${error.message}`)
  return res.status(error.status).send({ error: true, message: error.message })
}

const sendResponse = (res: express.Response, result: Record<string, unknown>) => {
  console.log(`response: ${JSON.stringify(result)}`)
  return res.send(result)
}

app.post('/odai', async (req: express.Request, res) => {
  const params = req.body as OdaiPostRequestParams
  if (!params.slackTeamId || !params.title || !params.dueDate || !params.createdBy) {
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

  const putResult = await odaiService.finish(params)
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
  const params = req.body as VoteRequestParams
  if (!params.slackTeamId || !params.content || !params.votedBy || !params.rank) {
    return errorResponse(res, IllegalArgumentError)
  }
  const result = await voteService.create(params)
  if (hasError(result)) {
    return errorResponse(res, result)
  }

  return sendResponse(res, { error: false })
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

exports.api = functions.region(REGION).https.onRequest(app)
