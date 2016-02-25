import express from 'express'
import debugLogger from 'debug'

import userSerialize from '../serializers/user'

const debug = debugLogger('webd2-api:api')
const router = express.Router()

router.get('/', function (req, res, next) {
  debug('the root of api/v1')

  let users = [{
    id: 1,
    shortName: 'John'
  }, {
    id: 2,
    shortName: 'Mackbet'
  }]

  res.send(userSerialize(users))
})

export default router
