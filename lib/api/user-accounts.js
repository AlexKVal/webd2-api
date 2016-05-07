'use strict'

const router = require('express').Router()

const {debugApi} = require('../utils/debug')
const userAccount = require('../models/user-account')

const idParamParser = require('./id-param-parser')
const ApiWrapper = require('./api-wrapper')
const apiWrappedUserAccount = new ApiWrapper(userAccount)

function readAll (req, res, next) {
  debugApi(`user-accounts#readAll query:${JSON.stringify(req.query)}`)

  apiWrappedUserAccount.apiFetchMany({withRelated: true})
  .then((data) => res.json(data))
  .catch((err) => next(err))
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

router.param('id', idParamParser)

router.route('/')
  .get(readAll)
  .post(create)

router.route('/:id')
  .get(read)
  .patch(update)

module.exports = router
