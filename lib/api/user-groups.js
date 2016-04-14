'use strict'

const router = require('express').Router()

const userGroup = require('../models/user-group')
const user = require('../models/user')
const {debugApi} = require('../utils/debug')
const {fetchHasManyRelation} = require('../utils/relations-old')

function readAll (req, res, next) {
  debugApi('user-group/readAll')

  fetchHasManyRelation({
    model: userGroup,
    hasMany: user
  })
  .then((json) => res.send(json))
  .catch((err) => next(err))
}

router.route('/')
  .get(readAll)

module.exports = router
