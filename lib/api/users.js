'use strict'

const User = require('../models/user')
const UserGroup = require('../models/user-group')
const getSerializer = require('../utils/serializer')
const {debugApi} = require('../utils/debug')
const {BadRequestError} = require('../errors')

const {fetchBelongsToRelation} = require('./relations')

function readAll (req, res, next) {
  debugApi('users/readAll')

  fetchBelongsToRelation({
    model: User,
    belongsTo: UserGroup
  })
  .then((json) => res.send(json))
  .catch((err) => next(err))
}

function params (req, res, next, id) {
  const idInt = parseInt(id, 10)
  debugApi(`users/params id: ${id}, idInt: ${idInt}`)

  if (isNaN(idInt)) return next(new BadRequestError(`param ${id}`))

  req.id = idInt
  next()
}

function read (req, res, next) {
  debugApi('users/read')

  User.get(req.id)
    .then((data) => res.send(getSerializer('user', User.fields)(data)))
    .catch((err) => next(err))
}

module.exports = {
  readAll,
  params,
  read
}
