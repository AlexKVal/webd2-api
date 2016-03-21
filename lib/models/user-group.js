'use strict'

const {
  DbError
} = require('jsonapi-errors/lib/errors')

const getDatabase = require('webd2-db').getDatabase

const {debugSql} = require('../utils/debug')

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const fields = ['name']

/**
 * SQL queries
 */
const sqlAll = `SELECT GrpID as id,
${fields.join(', ')}
FROM sPepTree
WHERE Hide=False
AND grpid IN
 (SELECT grpid
 FROM sPersonal
 WHERE hide=false
 GROUP BY grpid)
ORDER BY name`

/**
 * Model methods
 */
const Model = {
  name: 'user-group',
  fields: fields,

  all () {
    debugSql('user-group:all', sqlAll)

    return database.exec(sqlAll)
    .catch((dbMsg) => { throw new DbError(dbMsg) })
  }
}

module.exports = Model
