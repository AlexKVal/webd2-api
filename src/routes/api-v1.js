import express from 'express'
import debugLogger from 'debug'

const debug = debugLogger('webd2-api:api')
const router = express.Router()

router.get('/', function (req, res, next) {
  debug('the root of api/v1')
  res.send('respond with a resource 1')
})

export default router
