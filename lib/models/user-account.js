'use strict'

const db = require('../utils/database').getDatabase()
const {generateUpdateSetPart} = require('../sql-builder/sql-generators')
const BaseModel = require('./base-model')
const userGroup = require('./user-group')

class UserAccount extends BaseModel {
  sqlAll (query) {
    const userGroupRel = this.schema.relations.userGroup // TODO
    return `SELECT PersID as id,
      ${userGroupRel.fkField} as ${userGroupRel.fkAs},
      ${this.schema.dataFieldsNames.join(', ')}
      FROM sPersonal`
  }

  sqlOne (id) {
    const userGroupRel = this.schema.relations.userGroup // TODO
    return `SELECT PersID as id,
      ${userGroupRel.fkField} as ${userGroupRel.fkAs},
      ${this.schema.dataFieldsNames.join(', ')}
      FROM sPersonal
      WHERE PersID=${id}`
  }

  sqlIsRowExist (id) {
    return `SELECT PersID as id FROM sPersonal WHERE PersID=${id}`
  }

  // TODO rights='${data.rights}' => rights='${data.rights.id}'
  sqlUpdate (id, data) {
    let setLines = generateUpdateSetPart(data, this.schema)
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
    const userGroupRel = this.schema.relations.userGroup // TODO
    return `SELECT PersID as id,
      ${userGroupRel.fkField} as ${userGroupRel.fkAs},
      ${this.schema.dataFieldsNames.join(', ')}
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
