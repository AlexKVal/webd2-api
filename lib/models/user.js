const getDatabase = require('webd2-db').getDatabase
const debugLogger = require('debug')

const debug = (msg) => debugLogger('webd2-api:sql')('\n' + msg)

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
    debug(sqlAll)

    return database.select(sqlAll)
  },

  get (id) {
    const sql = sqlOne(id)
    debug(sql)

    return database
      .select(sql)
      .then((rows) => {
        if (rows.length === 0) {
          return Promise.reject('[odbc] returned empty result')
        } else {
          return rows[0]
        }
      })
  }
}

module.exports = User
