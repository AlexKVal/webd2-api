'use strict'

const UserGroup = require('../models/user-group')
const User = require('../models/user')
const {debugApi} = require('../utils/debug')

const {fetchHasManyRelation} = require('./relations')

function readAll (req, res, next) {
  debugApi('user-group/readAll')

  fetchHasManyRelation({
    model: UserGroup,
    hasMany: User
  })
  .then((json) => res.send(json))
  .catch((err) => next(err))
}

module.exports = {
  readAll
}
