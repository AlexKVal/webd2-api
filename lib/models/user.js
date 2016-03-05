const getDatabase = require('webd2-db').getDatabase
const debug = require('debug')('webd2-api:sql')

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
    debug(`user:all\n${sqlAll}`)

    return database.select(sqlAll)
  },

  get (id) {
    const sql = sqlOne(id)
    debug(`user:get(${id})\n${sql}`)

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
