'use strict'

const db = require('../utils/database').getDatabase()
const BaseModel = require('./base-model')
const userGroup = require('./user-group')

class UserAccount extends BaseModel {
  sqlAll (query) {
    return `SELECT
    ${this.sqlBuilder.generateSelectFieldsPart()}
    FROM sPersonal`
  }

  sqlOne (id) {
    return `SELECT
    ${this.sqlBuilder.generateSelectFieldsPart()}
    FROM sPersonal
    WHERE PersID=${id}`
  }

  sqlIsRowExist (id) {
    return `SELECT PersID as id FROM sPersonal WHERE PersID=${id}`
  }

  // TODO rights='${data.rights}' => rights='${data.rights.id}'
  sqlUpdate (id, data) {
    let setLines = this.sqlBuilder.generateUpdateSetPart(data)
    setLines.push(`grpid=${data.userGroup.id}`)

    return `UPDATE sPersonal
      SET ${setLines.join(', ')}
      WHERE PersID=${id}`
  }

  sqlCreate (data) {
    return `INSERT INTO sPersonal
    (
      GrpID,
      name,
      password,
      cardcode,
      rights
    )
    VALUES (
      ${data.userGroup.id},
      '${data.name}',
      '${data.password}',
      '${data.cardcode}',
      ${data.rights}
    )`
  }

  sqlDataWithID (data) {
    return `SELECT
    ${this.sqlBuilder.generateSelectFieldsPart()}
    FROM sPersonal
    WHERE
      GrpID=${data.userGroup.id} AND
      name='${data.name}' AND
      password='${data.password}' AND
      cardcode='${data.cardcode}' AND
      rights=${data.rights}`
  }
}

const model = new UserAccount(db, 'user-account', {
  id: 'PersID',
  name: 'string',
  password: 'string',
  cardcode: 'string',
  rights: 'string', // temporarily for prototyping
  hide: 'boolean',

  userGroup: {
    belongsTo: userGroup,
    fkField: 'GrpID'
  }
})

module.exports = model
