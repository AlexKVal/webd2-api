'use strict'

const router = require('express').Router()
const {BadRequestError} = require('jsonapi-errors/lib/errors')

const {debugApi} = require('../utils/debug')
const userAccount = require('../models/user-account')

const ApiWrapper = require('./api-wrapper')
const apiWrappedUserAccount = new ApiWrapper(userAccount)

function readAll (req, res, next) {
  debugApi(`user-accounts#readAll query:${JSON.stringify(req.query)}`)

  apiWrappedUserAccount.apiFetchAll({withRelated: true})
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

  apiWrappedUserAccount.apiFind(req.id)
  .then((data) => res.json(data))
  .catch((err) => next(err))
}

function update (req, res, next) {
  debugApi('user-accounts#update')

  apiWrappedUserAccount.apiUpdate(req.id, req.body)
  .then((updated) => res.status(201).json(updated))
  .catch((err) => next(err))
}

function create (req, res, next) {
  debugApi('user-accounts#create')

  apiWrappedUserAccount.apiCreate(req.body)
  .then((updated) => res.status(201).json(updated))
  .catch((err) => next(err))
}

router.param('id', params)

router.route('/')
  .get(readAll)
  .post(create)

router.route('/:id')
  .get(read)
  .patch(update)

module.exports = router
