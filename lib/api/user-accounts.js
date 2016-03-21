'use strict'

const router = require('express').Router()
const {BadRequestError} = require('jsonapi-errors/lib/errors')

const UserAccount = require('../models/user-account')
const UserGroup = require('../models/user-group')
const {debugApi} = require('../utils/debug')
const {fetchBelongsToRelation} = require('../utils/relations')

function readAll (req, res, next) {
  debugApi('user-accounts#readAll')

  fetchBelongsToRelation({
    model: UserAccount,
    belongsTo: UserGroup
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

  UserAccount.get(req.id)
    .then((data) => res.json(UserAccount.serialize(data)))
    .catch((err) => next(err))
}

function update (req, res, next) {
  debugApi('user-accounts#update')

  UserAccount.deserialize(req.body, (err, data) => {
    if (err) return next(err)

    UserAccount.findByIdAndUpdate(req.id, data)
    .then((saved) => res.status(201).json(UserAccount.serialize(saved)))
    .catch((err) => next(err))
  })
}

router.param('id', params)

router.route('/')
  .get(readAll)
  // .post(create)

router.route('/:id')
  .get(read)
  .patch(update)
  // .del(delete)

// router.put('/password', changePassword)

module.exports = router
