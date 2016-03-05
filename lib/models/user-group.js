'use strict'

const getDatabase = require('webd2-db').getDatabase

const {debugSql} = require('../utils/debug')

const {
  DbError
} = require('../errors')

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const fields = ['name']

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

const UserGroup = {
  name: 'user-group',
  fields: fields,

  all () {
    debugSql('user-group:all', sqlAll)

    return database
      .select(sqlAll)
      .catch((errMessage) => {
        throw new DbError(errMessage)
      })
  }
}

module.exports = UserGroup
