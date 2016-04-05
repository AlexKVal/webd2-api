'use strict'

const {
  DbError
} = require('jsonapi-errors/lib/errors')

const getDatabase = require('webd2-db').getDatabase

const {debugSql} = require('../utils/debug')
const Schema = require('../sql-builder/schema')

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const schema = new Schema({
  name: 'string'
})

/**
 * SQL queries
 */
function sqlAll () {
  return `SELECT GrpID as id,
  ${Model.schema.dataFieldsNames.join(', ')}
  FROM sPepTree
  WHERE Hide=False
  AND grpid IN
   (SELECT grpid
   FROM sPersonal
   WHERE hide=false
   GROUP BY grpid)
  ORDER BY name`
}

/**
 * Model methods
 */
const Model = {
  name: 'user-group',
  schema,

  all () {
    const sql = sqlAll()
    debugSql('user-group:all', sql)

    return database.exec(sql)
    .catch((dbMsg) => { throw new DbError(dbMsg) })
  }
}

module.exports = Model
