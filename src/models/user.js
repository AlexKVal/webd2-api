import {getDatabase} from 'webd2-db'
import getSerializer from '../utils/serializer'

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const attributes = ['Name', 'Password']

const sql = `SELECT PersID as id,
${attributes.join(',')}
FROM sPersonal
WHERE Hide=False`

const User = {
  all () {
    return database
      .select(sql)
      .then((rows) => getSerializer('users', attributes)(rows))
  }
}

export default User
