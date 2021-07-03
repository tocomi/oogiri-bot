import * as functions from 'firebase-functions'
import * as express from 'express'
import * as cors from 'cors'
import { OdaiPostRequestParams } from './types/Odai'
import { OdaiRepository, OdaiRepositoryImpl } from './repository/OdaiRepository'
import { OdaiUseCase, OdaiUseCaseImpl } from './usecase/OdaiUseCase'

const REGION = 'asia-northeast1'

const app = express()
app.use(cors({ origin: true }))

const odaiRepository: OdaiRepository = new OdaiRepositoryImpl()
const odaiUseCase: OdaiUseCase = new OdaiUseCaseImpl(odaiRepository)

app.post('/odai', async (req: express.Request, res) => {
  const { title, createdBy } = req.body as OdaiPostRequestParams
  if (!title || !createdBy) {
    return res.status(400).send({ message: 'Illegal Argument.' })
  }
  const result = await odaiUseCase.create({ title, createdBy })
  return res.send(result)
})

exports.api = functions.region(REGION).https.onRequest(app)
