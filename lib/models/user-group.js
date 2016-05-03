'use strict'

const registry = require('./registry')
const BaseModel = require('./base-model')

class UserGroup extends BaseModel {}

UserGroup.schemaObject = {
  tableName: 'sPepTree',
  id: 'GrpID',
  name: 'string'
}

module.exports = registry.model('userGroup', UserGroup)
