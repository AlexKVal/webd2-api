'use strict'

const router = require('express').Router()
const {BadRequestError} = require('jsonapi-errors/lib/errors')

const userAccount = require('../models/user-account')
const userGroup = require('../models/user-group')
const {debugApi} = require('../utils/debug')
const {fetchBelongsToRelation} = require('../utils/relations-old')

function readAll (req, res, next) {
  debugApi(`user-accounts#readAll query:${JSON.stringify(req.query)}`)

  fetchBelongsToRelation({
    model: userAccount,
    belongsTo: userGroup,
    query: req.query
  })
  .then((json) => res.send(json))
  .catch((err) => next(err))
}

function params (req, res, next, id) {
  const idInt = parseInt(id, 10)
  debugApi(`user-accounts#params id: ${id}`)

  if (isNaN(idInt)) return next(new BadRequestError(`param ${id}`))

  req.id = idInt
  next()
}

function read (req, res, next) {
  debugApi('user-accounts#read')

  userAccount.get(req.id)
    .then((data) => res.json(userAccount.serialize(data)))
    .catch((err) => next(err))
}

function update (req, res, next) {
  debugApi('user-accounts#update')

  userAccount.deserialize(req.body, (err, data) => {
    if (err) return next(err)

    userAccount.update(req.id, data)
    .then((saved) => res.status(201).json(userAccount.serialize(saved)))
    .catch((err) => next(err))
  })
}

function create (req, res, next) {
  debugApi(`user-accounts#create ${JSON.stringify(req.body)}`)

  userAccount.deserialize(req.body, (err, data) => {
    if (err) return next(err)

    userAccount.create(data)
    .then((saved) => res.status(201).json(userAccount.serialize(saved)))
    .catch((err) => next(err))
  })
}

router.param('id', params)

router.route('/')
  .get(readAll)
  .post(create)

router.route('/:id')
  .get(read)
  .patch(update)

module.exports = router
