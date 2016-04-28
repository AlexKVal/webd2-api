'use strict'

const debug = require('debug')('webd2-api:model')
const {
  BadRequestError,
  UnauthorizedError
} = require('jsonapi-errors/lib/errors')

const db = require('../utils/database').getDatabase()
const BaseModel = require('./base-model')
const userGroup = require('./user-group')

class User extends BaseModel {
  /**
   * override it to provide own options
   */
  all () {
    const options = {
      where: {hide: false},
      orderBy: 'name'
    }
    return super.all(options)
  }

  passwordVerify (id, password) {
    debug(`${this.name}#passwordVerify`)

    if (!id || !password) return Promise.reject(new BadRequestError('submit id and password'))

    return this.get({
      id: id,
      where: { hide: false, password: password }
    })
    .then((users) => users[0])
    .catch((error) => {
      if (error.code === 'ENOTFOUND') throw new UnauthorizedError('wrong credentials')

      throw error
    })
  }
}

const model = new User(db, 'user', {
  tableName: 'sPersonal',
  id: 'PersID',
  name: 'string',

  userGroup: {
    belongsTo: userGroup,
    fkField: 'GrpID'
  }
})

module.exports = model
