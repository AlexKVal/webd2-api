'use strict'

require('./user')
const registry = require('./registry')
const BaseModel = require('./base-model')

class UserGroup extends BaseModel {
  create (data) {
    /**
     * create all new 1-lvl-groups under the root node
     * it is not public and always = 1
     */
    data.parentid = 1
    return super.create(data, { parentid: 'integer' })
  }
}

UserGroup.schemaObject = {
  tableName: 'sPepTree',
  id: 'GrpID',
  name: 'string',
  hide: 'boolean',
  info: 'string',

  users: {
    hasMany: 'user',
    fkField: 'GrpID'
  }
}

module.exports = registry.model('userGroup', UserGroup)
