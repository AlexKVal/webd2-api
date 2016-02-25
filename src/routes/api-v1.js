import express from 'express'
import debugLogger from 'debug'

import User from '../models/user'

const debug = debugLogger('webd2-api:api')
const router = express.Router()

router.get('/', function (req, res, next) {
  debug('the root of api/v1')

  User.all()
    .then((users) => res.send(users))
    .catch((err) => res.send(err))
})

export default router
