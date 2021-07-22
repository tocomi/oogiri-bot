import * as functions from 'firebase-functions'
import * as express from 'express'
import * as cors from 'cors'
import { OdaiCurrentParams, OdaiPostRequestParams, OdaiPutStatusParams } from './odai/Odai'
import { OdaiRepository, OdaiRepositoryImpl } from './odai/OdaiRepository'
import { OdaiService, OdaiServiceImpl } from './odai/OdaiService'
import { KotaePostRequestParams } from './kotae/Kotae'
import { KotaeRepository, KotaeRepositoryImpl } from './kotae/KotaeRepository'
import { KotaeService, KotaeServiceImpl } from './kotae/KotaeService'
import { VoteRepository, VoteRepositoryImpl } from './vote/VoteRepository'
import { VoteService, VoteServiceImpl } from './vote/VoteService'
import { VoteRequestParams } from './vote/Vote'

const REGION = 'asia-northeast1'

const app = express()
app.use(cors({ origin: true }))

const odaiRepository: OdaiRepository = new OdaiRepositoryImpl()
const odaiService: OdaiService = new OdaiServiceImpl(odaiRepository)
const kotaeRepository: KotaeRepository = new KotaeRepositoryImpl()
const kotaeService: KotaeService = new KotaeServiceImpl(kotaeRepository, odaiService)
const voteRepository: VoteRepository = new VoteRepositoryImpl()
const voteService: VoteService = new VoteServiceImpl(voteRepository, odaiService)

const errorResponse = (res: express.Response, statusCode: number, message: string) => {
  return res.status(statusCode).send({ error: true, message })
}

app.post('/odai', async (req: express.Request, res) => {
  const { slackTeamId, title, createdBy } = req.body as OdaiPostRequestParams
  if (!slackTeamId || !title || !createdBy) {
    return errorResponse(res, 422, 'Illegal Argument')
  }
  const result = await odaiService.create({ slackTeamId, title, createdBy })
  if (result === 'error') {
    return errorResponse(res, 500, 'Internal Server Error')
  }
  if (result === 'duplication') {
    return errorResponse(res, 400, 'Odai Duplication')
  }
  return res.send({ error: false })
})

app.get('/odai/current', async (req: express.Request, res) => {
  const { slackTeamId } = req.body as OdaiCurrentParams
  if (!slackTeamId) {
    return errorResponse(res, 422, 'Illegal Argument')
  }
  const result = await odaiService.getCurrent({ slackTeamId })
  return res.send({ odai: result })
})

app.post('/odai/start-voting', async (req: express.Request, res) => {
  const { slackTeamId } = req.body as OdaiPutStatusParams
  if (!slackTeamId) {
    return errorResponse(res, 422, 'Illegal Argument')
  }

  const result = await kotaeService.getAllOfCurrentOdai({ slackTeamId })
  if (result === 'noOdai') {
    return errorResponse(res, 400, 'No Active Odai')
  }

  const putResult = await odaiService.startVoting({ slackTeamId })
  if (putResult === 'error') {
    return errorResponse(res, 500, 'Internal Server Error')
  }
  if (putResult === 'noOdai') {
    return errorResponse(res, 400, 'No Active Odai')
  }
  if (putResult === 'noPostingOdai') {
    return errorResponse(res, 400, 'No Posting Odai')
  }

  return res.send({ odaiTitle: result.odaiTitle, kotaeList: result.kotaeList })
})

app.post('/odai/finish', async (req: express.Request, res) => {
  const { slackTeamId } = req.body as OdaiPutStatusParams
  if (!slackTeamId) {
    return errorResponse(res, 422, 'Illegal Argument')
  }

  const result = await kotaeService.getAllOfCurrentOdai({ slackTeamId })
  if (result === 'noOdai') {
    return errorResponse(res, 400, 'No Active Odai')
  }

  const putResult = await odaiService.finish({ slackTeamId })
  if (putResult === 'error') {
    return errorResponse(res, 500, 'Internal Server Error')
  }
  if (putResult === 'noOdai') {
    return errorResponse(res, 400, 'No Active Odai')
  }
  if (putResult === 'noVotingOdai') {
    return errorResponse(res, 400, 'No Voting Odai')
  }

  return res.send({ odaiTitle: result.odaiTitle, kotaeList: result.kotaeList })
})

app.post('/kotae', async (req: express.Request, res) => {
  const { slackTeamId, content, createdBy } = req.body as KotaePostRequestParams
  if (!slackTeamId || !content || !createdBy) {
    return errorResponse(res, 422, 'Illegal Argument')
  }
  const result = await kotaeService.create({ slackTeamId, content, createdBy })
  if (result === 'error') {
    return errorResponse(res, 500, 'Internal Server Error')
  }
  if (result === 'noOdai') {
    return errorResponse(res, 400, 'No Active Odai')
  }
  return res.send({ error: false })
})

app.get('/kotae/current', async (req: express.Request, res) => {
  const { slackTeamId } = req.body as OdaiPutStatusParams
  if (!slackTeamId) {
    return errorResponse(res, 422, 'Illegal Argument')
  }

  const result = await kotaeService.getAllOfCurrentOdai({ slackTeamId })
  if (result === 'noOdai') {
    return errorResponse(res, 400, 'No Active Odai')
  }
  return res.send({ odaiTitle: result.odaiTitle, kotaeList: result.kotaeList })
})

app.post('/kotae/vote', async (req: express.Request, res) => {
  const { slackTeamId, content, votedBy } = req.body as VoteRequestParams
  if (!slackTeamId || !content || !votedBy) {
    return errorResponse(res, 422, 'Illegal Argument')
  }
  const result = await voteService.create({ slackTeamId, content, votedBy })
  if (result === 'error') {
    return errorResponse(res, 500, 'Internal Server Error')
  }
  if (result === 'noOdai') {
    return errorResponse(res, 400, 'No Active Odai')
  }
  if (result === 'noKotae') {
    return errorResponse(res, 400, 'No Target Kotae')
  }
  if (result === 'alreadyVoted') {
    return errorResponse(res, 400, 'Already Voted')
  }
  return res.send({ error: false })
})

exports.api = functions.region(REGION).https.onRequest(app)
