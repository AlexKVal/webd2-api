'use strict'

const {
  DbError,
  NotFoundError
} = require('jsonapi-errors/lib/errors')

const getDatabase = require('webd2-db').getDatabase

const {debugSql} = require('../utils/debug')
const foreignKey = require('../utils/foreign-key')

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const fields = ['name', 'password', 'rights']
const fkName = foreignKey('user-group')

const sqlAll = `SELECT PersID as id, GrpID as ${fkName},
${fields.join(', ')}
FROM sPersonal
WHERE Hide=False
ORDER BY rights, name`

const sqlOne = function sqlOne (id) {
  return `SELECT PersID as id, GrpID as ${fkName},
    ${fields.join(', ')}
    FROM sPersonal
    WHERE Hide=False AND PersID=${id}`
}

const UserAccount = {
  name: 'user-account',
  fields: fields,

  all () {
    debugSql('user-account:all', sqlAll)

    return database
      .select(sqlAll)
      .catch((errMessage) => {
        throw new DbError(errMessage)
      })
  },

  get (id) {
    const sql = sqlOne(id)
    debugSql(`user-account:get(${id})`, sql)

    return database
      .select(sql)
      .catch((dbErrMessage) => {
        throw new DbError(dbErrMessage)
      })
      .then((rows) => {
        if (rows.length === 0) throw new NotFoundError('db returned an empty result')

        return rows[0]
      })
  }
}

module.exports = UserAccount
