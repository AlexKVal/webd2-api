'use strict'
/**
 * for the case: apiFetchMany({withRelated: false}) hasMany
 */
const router = require('express').Router()

const {debugApi} = require('../utils/debug')
const user = require('../models/user')

const idParamParser = require('./id-param-parser')
const ApiWrapper = require('./api-wrapper')
const apiWrappedUser = new ApiWrapper(user)

function readAll (req, res, next) {
  debugApi(`users#readAll query:${JSON.stringify(req.query)}`)

  apiWrappedUser.apiFetchMany()
  .then((data) => res.json(data))
  .catch((err) => next(err))
}

function read (req, res, next) {
  debugApi('users#read')

  apiWrappedUser.apiFind(req.id)
  .then((data) => res.json(data))
  .catch((err) => next(err))
}

router.param('id', idParamParser)

router.route('/')
  .get(readAll)

router.route('/:id')
  .get(read)

module.exports = router
