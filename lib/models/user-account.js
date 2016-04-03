'use strict'

const _ = require('lodash')
const Serializer = require('jsonapi-serializer').Serializer
const Deserializer = require('jsonapi-serializer').Deserializer
const getDatabase = require('webd2-db').getDatabase
const {
  DbError,
  NotFoundError
} = require('jsonapi-errors/lib/errors')

const {debugSql} = require('../utils/debug')
const {castTypesRows, castTypesRow} = require('../utils/cast-types')
const foreignKey = require('../sql-builder/foreign-key')
const {generateSetDataLines} = require('../sql-builder/sql-generators')

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const schema = {
  name: 'string',
  password: 'string',
  cardcode: 'string',
  rights: 'string', // temporarily for prototyping
  hide: 'boolean'
}

// rights: 'id', relations should be described separately
const fkName = foreignKey('user-group')

/**
 * SQL queries
 */
function sqlAll (query) {
  return `SELECT PersID as id, GrpID as ${fkName},
    ${Model.fields.join(', ')}
    FROM sPersonal`
}

function sqlOne (id) {
  return `SELECT PersID as id, GrpID as ${fkName},
    ${Model.fields.join(', ')}
    FROM sPersonal
    WHERE PersID=${id}`
}

function sqlIsRowExist (id) {
  return `SELECT PersID as id FROM sPersonal WHERE PersID=${id}`
}

// TODO rights='${data.rights}' => rights='${data.rights.id}'
function sqlUpdate (id, data) {
  let setLines = generateSetDataLines(data, Model.schema)
  setLines.push(`grpid=${data.userGroup.id}`)

  return `UPDATE sPersonal
    SET ${setLines.join(', ')}
    WHERE PersID=${id}`
}

function sqlCreate (data) {
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

function sqlDataWithID (data) {
  return `SELECT PersID as id, GrpID as ${fkName},
    ${Model.fields.join(', ')}
    FROM sPersonal
    WHERE
      GrpID=${data.userGroup.id} AND
      name='${data.name}' AND
      password='${data.password}' AND
      cardcode='${data.cardcode}' AND
      rights=${data.rights}`
}

/**
 * Model methods
 */
const Model = {
  name: 'user-account',
  fields: Object.keys(schema),
  schema,

  all (query) {
    const sql = sqlAll(query)
    debugSql('user-account:all', sql)

    return database.exec(sql)
    .catch((dbMsg) => { throw new DbError(dbMsg) })
  },

  get (id) {
    const sql = sqlOne(id)
    debugSql(`user-account:get(${id})`, sql)

    return database.exec(sql)
    .catch((dbMsg) => { throw new DbError(dbMsg) })
    .then((rows) => {
      if (rows.length === 0) throw new NotFoundError('db returned an empty result')

      return rows[0]
    })
  },

  findByIdAndUpdate (id, data) {
    const sqlUpdating = sqlUpdate(id, data)
    debugSql(`user-account:findByIdAndUpdate(${id})`, sqlUpdating)

    return database.exec(sqlIsRowExist(id))
    .catch((dbMsg) => { throw new DbError(dbMsg) })
    .then((rows) => {
      if (rows.length === 0) throw new NotFoundError(`row with id: ${id} does not exist`)

      return database.exec(sqlUpdating)
      .catch((dbMsg) => { throw new DbError(dbMsg) })
      .then(() => Model.get(id)) // if OK return new data
    })
  },

  create (data) {
    const sql = sqlCreate(data)
    debugSql(`user-account:create(data):\n${JSON.stringify(data, null, ' ')}`, sql)

    return database.exec(sql)
    .catch((dbMsg) => { throw new DbError(dbMsg) })
    .then(() => {
      const sqlGet = sqlDataWithID(data)
      debugSql('sqlDataWithID', sqlGet)
      return database.exec(sqlGet)
      .catch((dbMsg) => { throw new DbError(dbMsg) })
      .then((rows) => {
        if (rows.length === 0) {
          throw new NotFoundError(`something went wrong with [${data.name}]`)
        }
        return rows[0]
      })
    })
  }
}

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

Model.deserialize = function deserialize (dataSet, cb) {
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

const serializer = new Serializer('user-account', { attributes: Model.fields.concat(fkName) })

Model.serialize = function serialize (records) {
  if (records == null) throw new Error('Model.serialize() records cannot be undefined')

  return serializer.serialize(
    _.isArray(records)
    ? castTypesRows(records, schema)
    : castTypesRow(records, schema)
  )
}

module.exports = Model
