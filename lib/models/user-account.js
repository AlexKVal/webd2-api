'use strict'

const Deserializer = require('jsonapi-serializer').Deserializer
const getDatabase = require('webd2-db').getDatabase

const {generateUpdateSetPart} = require('../sql-builder/sql-generators')
const BaseModel = require('./base-model')

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

const db = getDatabase(`DSN=${process.env.D2ALIAS}`)

const model = new UserAccount(db, 'user-account', {
  name: 'string',
  password: 'string',
  cardcode: 'string',
  rights: 'string', // temporarily for prototyping
  hide: 'boolean',

  userGroup: {
    belongsTo: 'user-group',
    fkField: 'GrpID'
  }
})

/**
 * serialize / deserialize methods
 */
const deserializer = new Deserializer({
  keyForAttribute: 'camelCase',

  'user-groups': {
    valueForRelationship (rel) {
      return { id: rel.id }
    }
  }
})

model.deserialize = function deserialize (dataSet, cb) {
  deserializer.deserialize(dataSet, (err, data) => {
    if (err) return cb(err)

    /**
     * normalize
     * jsonapi-serializer@3.0.0 doesn't obey "keyForAttribute: 'camelCase'"
     */
    data.userGroup = data['user-group']
    delete data['user-group']

    /**
     * validate
     * TODO: this has to be checked by validations layer
     */
    if (data.userGroup == null) {
      return cb(new Error('deserialize() UserAccount.userGroup is undefined'))
    }

    // return normalized and validated
    cb(null, data)
  })
}

module.exports = model
