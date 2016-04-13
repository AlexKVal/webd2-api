'use strict'

const router = require('express').Router()

const UserGroup = require('../models/registry')['user-group']
const User = require('../models/registry')['user']
const {debugApi} = require('../utils/debug')
const {fetchHasManyRelation} = require('../utils/relations-old')

function readAll (req, res, next) {
  debugApi('user-group/readAll')

  fetchHasManyRelation({
    model: UserGroup,
    hasMany: User
  })
  .then((json) => res.send(json))
  .catch((err) => next(err))
}

router.route('/')
  .get(readAll)

module.exports = router
