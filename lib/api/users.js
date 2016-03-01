const debugLogger = require('debug')

const User = require('../models/user')
const {
  DbError,
  NotFoundError
} = require('../errors')

const debug = debugLogger('webd2-api:api')

function readAll (req, res, next) {
  debug('users/readAll')

  User.all()
    .then((users) => res.send(users))
    .catch((errMessage) => next(new DbError(errMessage)))
}

function params (req, res, next, id) {
  const idInt = parseInt(id, 10)
  debug(`users/params id: ${id}, idInt: ${idInt}`)

  if (isNaN(idInt)) return next(new NotFoundError(`param ${id}`))

  req.id = idInt
  next()
}

function read (req, res, next) {
  debug('users/read')

  User.get(req.id)
    .then((user) => res.send(user))
    .catch((errMessage) => next(new NotFoundError(errMessage)))
}

module.exports = {
  readAll,
  params,
  read
}
