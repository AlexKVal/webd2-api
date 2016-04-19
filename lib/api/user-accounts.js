'use strict'

const router = require('express').Router()
const {BadRequestError} = require('jsonapi-errors/lib/errors')

const userAccount = require('../models/user-account')
const {debugApi} = require('../utils/debug')

function readAll (req, res, next) {
  debugApi(`user-accounts#readAll query:${JSON.stringify(req.query)}`)

  userAccount.apiFetchAll({withRelated: true})
  .then((data) => res.json(data))
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

  userAccount.apiFind(req.id)
  .then((data) => res.json(data))
  .catch((err) => next(err))
}

function update (req, res, next) {
  debugApi('user-accounts#update')

  userAccount.apiUpdate(req.id, req.body)
  .then((updated) => res.status(201).json(updated))
  .catch((err) => next(err))
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
