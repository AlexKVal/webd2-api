'use strict'

const debug = require('debug')('webd2-api:model')
const {
  BadRequestError,
  DbError,
  UnauthorizedError
} = require('jsonapi-errors/lib/errors')

const db = require('../utils/database').getDatabase()
const BaseModel = require('./base-model')
const userGroup = require('./user-group')

class User extends BaseModel {
  sqlAll () {
    const userGroupRel = this.schema.relations.userGroup // TODO
    return `SELECT PersID as id,
    ${userGroupRel.fkField} as ${userGroupRel.fkAs},
    ${this.schema.dataFieldsNames.join(', ')}
    FROM sPersonal
    WHERE Hide=False
    ORDER BY name`
  }

  passwordVerifySql (id, password) {
    return `SELECT PersID as id,
      ${this.schema.dataFieldsNames.join(', ')}
      FROM sPersonal
      WHERE Hide=False
      AND PersID=${id}
      AND password='${password}'`
  }

  passwordVerify (id, password) {
    debug(`${this.name}#passwordVerify`)

    if (!id || !password) return Promise.reject(new BadRequestError('submit id and password'))

    return this.db.exec(this.passwordVerifySql(id, password))
    .catch((dbMsg) => { throw new DbError(dbMsg) })
    .then((rows) => {
      if (rows.length === 0) {
        return Promise.reject(new UnauthorizedError('wrong credentials'))
      }

      return rows[0] // user
    })
  }
}

const model = new User(db, 'user', {
  name: 'string',

  userGroup: {
    belongsTo: userGroup,
    fkField: 'GrpID'
  }
})

module.exports = model
