const getDatabase = require('webd2-db').getDatabase
const getSerializer = require('../utils/serializer')

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const attributes = ['name', 'password']

const sqlAll = `SELECT PersID as id,
${attributes.join(',')}
FROM sPersonal
WHERE Hide=False`

const sqlOne = function sqlOne (id) {
  return `SELECT PersID as id,
    ${attributes.join(',')}
    FROM sPersonal
    WHERE Hide=False AND PersID=${id}`
}

const User = {
  all () {
    return database
      .select(sqlAll)
      .then((rows) => getSerializer('users', attributes)(rows))
  },

  get (id) {
    return database
      .select(sqlOne(id))
      .then((rows) => {
        if (rows.length === 0) {
          return Promise.reject('[odbc] returned empty result')
        } else {
          return getSerializer('users', attributes)(rows)
        }
      })
  }
}

module.exports = User
