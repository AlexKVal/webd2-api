'use strict'

const UserGroup = require('../models/user-groups')
const getSerializer = require('../utils/serializer')
const {debugApi} = require('../utils/debug')

function readAll (req, res, next) {
  debugApi('user-groups/readAll')

  UserGroup.all()
    .then((data) => res.send(getSerializer('userGroups', UserGroup.fields)(data)))
    .catch((err) => next(err))
}

module.exports = {
  readAll
}
