'use strict'

const router = require('express').Router()

const {debugApi} = require('../utils/debug')
const userGroup = require('../models/user-group')

const idParamParser = require('./id-param-parser')
const ApiWrapper = require('./api-wrapper')

const apiWrappedUserGroup = new ApiWrapper(userGroup)

function readAll (req, res, next) {
  debugApi('user-group#readAll')

  apiWrappedUserGroup.apiFetchMany({
    // withRelated: true,

    relationsOptions: {
      user: {
        where: {hide: false},
        orderBy: 'name'
      }
    }
  })
  .then((json) => res.send(json))
  .catch((err) => next(err))
}

function read (req, res, next) {
  debugApi('user-group#read')

  apiWrappedUserGroup.apiFind(req.id)
  .then((data) => res.json(data))
  .catch((err) => next(err))
}

router.param('id', idParamParser)

router.route('/')
  .get(readAll)

router.route('/:id')
  .get(read)

module.exports = router
