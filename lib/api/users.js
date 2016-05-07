'use strict'
/**
 * for the case: apiFetchMany({withRelated: false}) hasMany
 */
const router = require('express').Router()
const {BadRequestError} = require('jsonapi-errors/lib/errors')

const {debugApi} = require('../utils/debug')
const user = require('../models/user')

const ApiWrapper = require('./api-wrapper')
const apiWrappedUser = new ApiWrapper(user)

function readAll (req, res, next) {
  debugApi(`users#readAll query:${JSON.stringify(req.query)}`)

  apiWrappedUser.apiFetchMany()
  .then((data) => res.json(data))
  .catch((err) => next(err))
}

function params (req, res, next, id) {
  const idInt = parseInt(id, 10)
  debugApi(`users#params id: ${id}`)

  if (isNaN(idInt)) return next(new BadRequestError(`param ${id}`))

  req.id = idInt
  next()
}

function read (req, res, next) {
  debugApi('users#read')

  apiWrappedUser.apiFind(req.id)
  .then((data) => res.json(data))
  .catch((err) => next(err))
}

router.param('id', params)

router.route('/')
  .get(readAll)

router.route('/:id')
  .get(read)

module.exports = router
