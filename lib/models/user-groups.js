const getDatabase = require('webd2-db').getDatabase
const debug = require('debug')('webd2-api:sql')

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const fields = ['name']

const sqlAll = `SELECT GrpID as id,
${fields.join(',')}
FROM sPepTree
WHERE Hide=False
AND grpid IN
 (SELECT grpid
 FROM sPersonal
 WHERE hide=false
 GROUP BY grpid)
ORDER BY name`

const UserGroup = {
  fields: fields,

  all () {
    debug(`user-group:all\n${sqlAll}`)

    return database.select(sqlAll)
  }
}

module.exports = UserGroup
