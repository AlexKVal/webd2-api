'use strict'

const db = require('../utils/database').getDatabase()
const BaseModel = require('./base-model')
const userGroup = require('./user-group')

class UserAccount extends BaseModel {}

const model = new UserAccount({db, name: 'user-account', schema: {
  tableName: 'sPersonal',
  id: 'PersID',
  name: 'string',
  password: 'string',
  cardcode: 'string',
  rights: 'string', // temporarily for prototyping
  hide: 'boolean',

  userGroup: {
    belongsTo: userGroup,
    fkField: 'GrpID'
  }
}})

module.exports = model
