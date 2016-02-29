import {getDatabase} from 'webd2-db'
import getSerializer from '../utils/serializer'

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const attributes = ['Name', 'Password']

const sqlAll = `SELECT PersID as id,
${attributes.join(',')}
FROM sPersonal
WHERE Hide=False`

const sqlOne = `SELECT PersID as id,
${attributes.join(',')}
FROM sPersonal
WHERE Hide=False AND PersID=?`

const User = {
  all () {
    return database
      .select(sqlAll)
      .then((rows) => getSerializer('users', attributes)(rows))
  },

  get (id) {
    return database
      .select(sqlOne, [id])
      .then((rows) => getSerializer('users', attributes)(rows))
  }
}

export default User
