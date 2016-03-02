const debugLogger = require('debug')

const UserGroup = require('../models/user-groups')
const {
  DbError
} = require('../errors')

const debug = debugLogger('webd2-api:api')

function readAll (req, res, next) {
  debug('user-groups/readAll')

  UserGroup.all()
    .then((data) => res.send(data))
    .catch((errMessage) => next(new DbError(errMessage)))
}

module.exports = {
  readAll
}
