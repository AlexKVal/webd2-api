'use strict'

const registry = require('./registry')
const BaseModel = require('./base-model')

class UserAccount extends BaseModel {}

UserAccount.schemaObject = {
  tableName: 'sPersonal',
  id: 'PersID',
  name: 'string',
  password: 'string',
  cardcode: 'string',
  rights: 'string', // temporarily for prototyping
  hide: 'boolean',

  userGroup: {
    belongsTo: 'userGroup',
    fkField: 'GrpID'
  }
}

module.exports = {
  UserAccount,
  register () {
    require('./user-group')
    return registry.model('userAccount', UserAccount)
  }
}
