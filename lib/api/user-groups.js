'use strict'

const router = require('express').Router()
const {BadRequestError} = require('jsonapi-errors/lib/errors')

const {debugApi} = require('../utils/debug')
const userGroup = require('../models/user-group')

const ApiWrapper = require('./api-wrapper')
const apiWrappedUserGroup = new ApiWrapper(userGroup)

function readAll (req, res, next) {
  debugApi('user-group#readAll')

  apiWrappedUserGroup.fetchHasMany('user')
  .then((json) => res.send(json))
  .catch((err) => next(err))
}

function params (req, res, next, id) {
  const idInt = parseInt(id, 10)
  debugApi(`user-group#params id: ${id}`)

  if (isNaN(idInt)) return next(new BadRequestError(`param ${id}`))

  req.id = idInt
  next()
}

function read (req, res, next) {
  debugApi('user-group#read')

  apiWrappedUserGroup.apiFind(req.id)
  .then((data) => res.json(data))
  .catch((err) => next(err))
}

router.param('id', params)

router.route('/')
  .get(readAll)

router.route('/:id')
  .get(read)

module.exports = router
