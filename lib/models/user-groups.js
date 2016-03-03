const getDatabase = require('webd2-db').getDatabase
const debugLogger = require('debug')

const debug = (msg) => debugLogger('webd2-api:sql')('\n' + msg)
const getSerializer = require('../utils/serializer')

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const attributes = ['name']

const sqlAll = `SELECT GrpID as id,
${attributes.join(',')}
FROM sPepTree
WHERE Hide=False
ORDER BY name`

const UserGroup = {
  all () {
    debug(sqlAll)

    return database
      .select(sqlAll)
      .then((rows) => getSerializer('userGroups', attributes)(rows))
  }
}

module.exports = UserGroup
