'use strict'

require('./user')
const registry = require('./registry')
const BaseModel = require('./base-model')

class UserGroup extends BaseModel {}

UserGroup.schemaObject = {
  tableName: 'sPepTree',
  id: 'GrpID',
  name: 'string',

  users: {
    hasMany: 'user',
    fkField: 'GrpID'
  }
}

module.exports = registry.model('userGroup', UserGroup)
