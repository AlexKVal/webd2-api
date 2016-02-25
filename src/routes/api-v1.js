import express from 'express'
import debugLogger from 'debug'

import User from '../models/user'
import {DbError} from '../errors'

const debug = debugLogger('webd2-api:api')
const router = express.Router()

router.get('/', function (req, res, next) {
  debug('the root of api/v1')

  User.all()
    .then((users) => res.send(users))
    .catch((errMessage) => next(new DbError(errMessage)))
})

export default router
