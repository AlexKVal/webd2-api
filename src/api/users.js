import debugLogger from 'debug'

import User from '../models/user'
import {
  DbError,
  NotFoundError
} from '../errors'

const debug = debugLogger('webd2-api:api')

function readAll (req, res, next) {
  debug('users/readAll')

  User.all()
    .then((users) => res.send(users))
    .catch((errMessage) => next(new DbError(errMessage)))
}

function params (req, res, next, id) {
  req.id = id
  next()
}

function read (req, res, next) {
  debug('users/read')

  User.get(req.id)
    .then((user) => res.send(user))
    .catch((errMessage) => next(new NotFoundError(errMessage)))
}

export default {
  readAll,
  params,
  read
}
