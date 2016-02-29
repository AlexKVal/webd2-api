import debugLogger from 'debug'

import User from '../models/user'
import {DbError} from '../errors'

const debug = debugLogger('webd2-api:api')

function readAll (req, res, next) {
  debug('users/readAll')

  User.all()
    .then((users) => res.send(users))
    .catch((errMessage) => next(new DbError(errMessage)))
}

function read (req, res, next) {
  debug('users/read')

  User.all()
    .then((users) => res.send(users))
    .catch((errMessage) => next(new DbError(errMessage)))
}

export default {
  readAll,
  read
}
