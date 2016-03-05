'use strict'

const getDatabase = require('webd2-db').getDatabase

const {debugSql} = require('../utils/debug')

const {
  DbError,
  NotFoundError
} = require('../errors')

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const fields = ['name', 'groupId']

const sqlAll = `SELECT PersID as id, GrpID as groupId,
${fields.join(',')}
FROM sPersonal
WHERE Hide=False
ORDER BY name`

const sqlOne = function sqlOne (id) {
  return `SELECT PersID as id, GrpID as groupId,
    ${fields.join(',')}
    FROM sPersonal
    WHERE Hide=False AND PersID=${id}`
}

const User = {
  fields: fields,

  all () {
    debugSql('user:all', sqlAll)

    return database
      .select(sqlAll)
      .catch((errMessage) => {
        throw new DbError(errMessage)
      })
  },

  get (id) {
    const sql = sqlOne(id)
    debugSql(`user:get(${id})`, sql)

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

module.exports = User
