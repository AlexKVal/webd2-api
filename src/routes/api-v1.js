import express from 'express'
import debugLogger from 'debug'
import {dbConnect} from 'webd2-db'

import userSerialize from '../serializers/user'

const debug = debugLogger('webd2-api:api')
const router = express.Router()

const database = dbConnect('DSN=D2Main.NET')

router.get('/', function (req, res, next) {
  debug('the root of api/v1')

  database
    .select('select PersID as id, Name, Password from sPersonal where Hide=False')
    .then((rows) => res.send(userSerialize(rows)))
    .catch((err) => res.send(err))
})

export default router
