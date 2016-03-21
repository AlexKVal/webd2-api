'use strict'

const {
  BadRequestError,
  DbError,
  UnauthorizedError
} = require('jsonapi-errors/lib/errors')

const getDatabase = require('webd2-db').getDatabase

const {debugSql} = require('../utils/debug')
const foreignKey = require('../utils/foreign-key')

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const fields = ['name']
const fkName = foreignKey('user-group')

const sqlAll = `SELECT PersID as id, GrpID as ${fkName},
${fields.join(', ')}
FROM sPersonal
WHERE Hide=False
ORDER BY name`

const passwordVerifySql = function passwordVerifySql (id, password) {
  return `SELECT PersID as id,
    ${fields.join(', ')}
    FROM sPersonal
    WHERE Hide=False
    AND PersID=${id}
    AND password='${password}'`
}

const User = {
  name: 'user',
  fields: fields,

  all () {
    debugSql('user:all', sqlAll)

    return database.exec(sqlAll)
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

module.exports = User
