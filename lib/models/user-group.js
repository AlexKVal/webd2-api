'use strict'

const db = require('../utils/database').getDatabase()
const BaseModel = require('./base-model')

class UserGroup extends BaseModel {
  sqlAll () {
    return `SELECT GrpID as id,
    ${this.schema.dataFieldsNames.join(', ')}
    FROM sPepTree`
  }

  sqlOne (id) {
    return `SELECT GrpID as id,
      ${this.schema.dataFieldsNames.join(', ')}
      FROM sPepTree
      WHERE GrpID=${id}`
  }
}

const model = new UserGroup(db, 'user-group', {
  name: 'string'
})

module.exports = model
