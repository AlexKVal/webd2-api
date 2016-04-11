'use strict'

const getDatabase = require('webd2-db').getDatabase

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

const db = getDatabase(`DSN=${process.env.D2ALIAS}`)

const model = new UserGroup(db, 'user-group', {
  name: 'string'
})

module.exports = model
