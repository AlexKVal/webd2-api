'use strict'

const db = require('../utils/database').getDatabase()
const BaseModel = require('./base-model')
const userGroup = require('./user-group')

class UserAccount extends BaseModel {
  sqlAll (query) {
    return `SELECT
    ${this.sqlBuilder.generateSelectFieldsPart()}
    FROM ${this.sqlBuilder.getTableName()}`
  }

  sqlOne (id) {
    return `SELECT
    ${this.sqlBuilder.generateSelectFieldsPart()}
    FROM ${this.sqlBuilder.getTableName()}
    WHERE ${this.sqlBuilder.getIdFieldName()}=${id}`
  }

  sqlIsRowExist (id) {
    return `SELECT ${this.sqlBuilder.getIdFieldLine()} FROM ${this.sqlBuilder.getTableName()} WHERE ${this.sqlBuilder.getIdFieldName()}=${id}`
  }

  sqlUpdate (id, data) {
    return `UPDATE ${this.sqlBuilder.getTableName()}
      SET ${this.sqlBuilder._generateFieldEqualsDataLines(data).join(', ')}
      WHERE ${this.sqlBuilder.getIdFieldName()}=${id}`
  }

  sqlCreate (data) {
    return `INSERT INTO ${this.sqlBuilder.getTableName()}
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
    FROM ${this.sqlBuilder.getTableName()}
    WHERE
      GrpID=${data.userGroup.id} AND
      name='${data.name}' AND
      password='${data.password}' AND
      cardcode='${data.cardcode}' AND
      rights=${data.rights}`
  }
}

const model = new UserAccount(db, 'user-account', {
  tableName: 'sPersonal',
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
