'use strict'

const db = require('../utils/database').getDatabase()
const BaseModel = require('./base-model')

class UserGroup extends BaseModel {
  sqlAll () {
    return `SELECT GrpID as id,
    ${this.schema.dataFieldsNames.join(', ')}
    FROM sPepTree
    WHERE Hide=False
    AND grpid IN
     (SELECT grpid
     FROM sPersonal
     WHERE hide=false
     GROUP BY grpid)
    ORDER BY name`
  }
}

const model = new UserGroup(db, 'user-group', {
  name: 'string'
})

module.exports = model
