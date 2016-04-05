'use strict'

const {
  BadRequestError,
  DbError,
  UnauthorizedError
} = require('jsonapi-errors/lib/errors')

const getDatabase = require('webd2-db').getDatabase

const {debugSql} = require('../utils/debug')
const Schema = require('../sql-builder/schema')

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const schema = new Schema({
  name: 'string',

  userGroup: {
    belongsTo: 'user-group',
    fkField: 'GrpID'
  }
})

function sqlAll () {
  const userGroupRel = Model.schema.relations.userGroup // TODO
  return `SELECT PersID as id,
  ${userGroupRel.fkField} as ${userGroupRel.fkAs},
  ${Model.schema.dataFieldsNames.join(', ')}
  FROM sPersonal
  WHERE Hide=False
  ORDER BY name`
}

function passwordVerifySql (id, password) {
  return `SELECT PersID as id,
    ${Model.schema.dataFieldsNames.join(', ')}
    FROM sPersonal
    WHERE Hide=False
    AND PersID=${id}
    AND password='${password}'`
}

const Model = {
  name: 'user',
  schema,

  all () {
    const sql = sqlAll()
    debugSql('user:all', sql)

    return database.exec(sql)
    .catch((dbMsg) => { throw new DbError(dbMsg) })
  },

  passwordVerify (id, password) {
    if (!id || !password) return Promise.reject(new BadRequestError('submit id and password'))

    const sql = passwordVerifySql(id, password)
    debugSql('user:passwordVerify', sql)

    return database.exec(sql)
    .catch((dbMsg) => { throw new DbError(dbMsg) })
    .then((rows) => {
      if (rows.length === 0) return Promise.reject(new UnauthorizedError('wrong credentials'))

      return rows[0] // user
    })
  }
}

module.exports = Model
