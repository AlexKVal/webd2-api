'use strict'

const debugLogger = require('debug')

const UserGroup = require('../models/user-groups')
const getSerializer = require('../utils/serializer')

const debug = debugLogger('webd2-api:api')

function readAll (req, res, next) {
  debug('user-groups/readAll')

  UserGroup.all()
    .then((data) => res.send(getSerializer('userGroups', UserGroup.fields)(data)))
    .catch((err) => next(err))
}

module.exports = {
  readAll
}
