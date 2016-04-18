'use strict'

const router = require('express').Router()
const {BadRequestError} = require('jsonapi-errors/lib/errors')

const userGroup = require('../models/user-group')
const user = require('../models/user')
const {debugApi} = require('../utils/debug')
const {fetchHasManyRelation} = require('../utils/relations-old')

function readAll (req, res, next) {
  debugApi('user-group#readAll')

  fetchHasManyRelation({
    model: userGroup,
    hasMany: user
  })
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

  userGroup.find(req.id)
  .then((data) => res.json(data))
  .catch((err) => next(err))
}

router.param('id', params)

router.route('/')
  .get(readAll)

router.route('/:id')
  .get(read)

module.exports = router
