import * as functions from 'firebase-functions'
import * as express from 'express'
import * as cors from 'cors'

const REGION = 'asia-northeast1'

const app = express()
app.use(cors({ origin: true }))

app.get('/odai/current', (req, res) => res.send({ status: 'OKOKOK' }))

exports.api = functions.region(REGION).https.onRequest(app)
