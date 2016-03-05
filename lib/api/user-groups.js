'use strict'

const UserGroup = require('../models/user-group')
const getSerializer = require('../utils/serializer')
const {debugApi} = require('../utils/debug')

function readAll (req, res, next) {
  debugApi('user-group/readAll')

  UserGroup.all()
    .then((data) => res.send(getSerializer('userGroup', UserGroup.fields)(data)))
    .catch((err) => next(err))
}

module.exports = {
  readAll
}
