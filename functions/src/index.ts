import * as functions from 'firebase-functions'
import * as express from 'express'
import * as cors from 'cors'
import { OdaiCurrentParams, OdaiPostRequestParams } from './odai/Odai'
import { OdaiRepository, OdaiRepositoryImpl } from './odai/OdaiRepository'
import { OdaiUseCase, OdaiUseCaseImpl } from './odai/OdaiUseCase'

const REGION = 'asia-northeast1'

const app = express()
app.use(cors({ origin: true }))

const odaiRepository: OdaiRepository = new OdaiRepositoryImpl()
const odaiUseCase: OdaiUseCase = new OdaiUseCaseImpl(odaiRepository)

const errorResponse = (res: express.Response, statusCode: number, message: string) => {
  return res.status(statusCode).send({ error: true, message })
}

app.post('/odai', async (req: express.Request, res) => {
  const { slackTeamId, title, createdBy } = req.body as OdaiPostRequestParams
  if (!slackTeamId || !title || !createdBy) {
    return errorResponse(res, 422, 'Illegal Argument')
  }
  const result = await odaiUseCase.create({ slackTeamId, title, createdBy })
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
  const result = await odaiUseCase.getCurrent({ slackTeamId })
  return res.send({ odai: result })
})

exports.api = functions.region(REGION).https.onRequest(app)
