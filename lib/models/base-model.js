'use strict'
const debug = require('debug')('webd2-api:model')
const _ = require('lodash')
const { NotFoundError } = require('jsonapi-errors/lib/errors')
const Serializer = require('jsonapi-serializer').Serializer
const Deserializer = require('jsonapi-serializer').Deserializer
const pluralize = require('pluralize')

const Schema = require('../sql-builder/Schema')
const {castTypes} = require('../utils/cast-types')
const camelCaseKeys = require('../utils/camel-case-keys')

class BaseModel {
  constructor (db, name, schema) {
    if (this.constructor === BaseModel) throw new TypeError('BaseModel is abstract class')

    if (!db) throw new Error('database is undefined')
    if (!name) throw new Error('name is undefined')

    this.db = db
    this.name = name

    if (schema && !(schema instanceof Object)) {
      throw new TypeError('schema attribute should be an object')
    }

    this.schema = new Schema(schema || {})

    this.serializer = new Serializer(name, {
      attributes: this.schema.attributes
    })

    this.deserializerOptions = {
      keyForAttribute: 'camelCase'
    }

    this.schema.belongsToRelations.forEach((relation) => {
      const pluralModelName = pluralize(relation.relationModel.name)
      this.deserializerOptions[pluralModelName] = {
        valueForRelationship (rel) { return { id: rel.id } }
      }
    })

    this.deserializer = new Deserializer(this.deserializerOptions)
  }

  sqlAll () { throw new Error('you should override sqlAll') }
  sqlOne () { throw new Error('you should override sqlOne') }
  sqlIsRowExist () { throw new Error('you should override sqlIsRowExist') }
  sqlUpdate () { throw new Error('you should override sqlUpdate') }
  sqlCreate () { throw new Error('you should override sqlCreate') }
  sqlDataWithID () { throw new Error('you should override sqlDataWithID') }

  /**
   * methods that return bare and did not type-cast records
   */
  all () {
    debug(`${this.name}:all`)
    return this.db.exec(this.sqlAll())
  }

  get (id) {
    if (id == null) throw new Error('no id has been provided')
    debug(`${this.name}:get${id}`)

    return this.db.exec(this.sqlOne(id))
    .then((rows) => {
      if (!rows || rows.length === 0) throw new NotFoundError('db returned no data')
      return rows[0]
    })
  }

  update (id, data) {
    if (id == null) throw new Error('no id has been provided')
    if (data == null) throw new Error('no data has been provided')
    debug(`${this.name}:update${id}`)

    return this.db.exec(this.sqlIsRowExist(id))
    .then((rows) => {
      if (rows.length === 0) throw new NotFoundError(`row with id: ${id} does not exist`)

      return this.db.exec(this.sqlUpdate(id, data))
      .then(() => this.get(id)) // if OK return new data
    })
  }

  create (data) {
    debug(`${this.name}:create`)

    return this.db.exec(this.sqlCreate(data))
    .then(() => {
      return this.db.exec(this.sqlDataWithID(data))
      .then((rows) => {
        if (rows.length === 0) {
          throw new NotFoundError(`something went wrong with INSERT ${JSON.stringify(data)}`)
        }
        return rows[0]
      })
    })
  }

  /**
   * methods that get and return JSONApi serialized data
   */
  fetchAll () {
    debug(`${this.name}:fetchAll`)

    return this.all()
    .then((records) => castTypes(records, this.schema))
    // .then((parentRows) => {
    //   return parentRows.map((parentRow) => {
    //     // parentRow[relationName] = _.find(castRelationRows, {'id': parentRow[fkName]})
    //     return parentRow
    //   })
    // })

    .then((castRecords) => this.serializer.serialize(castRecords))
  }

  _fetchBelongsToRelations () {
    return Promise.all(this.schema.belongsToRelations.map((rel) => {
      return rel.relationModel.all()
      .then((records) => castTypes(records, rel.relationModel.schema))
    }))
  }

  /**
   * Serializer
   */
  serialize (records) {
    if (records == null) throw new Error('model.serialize() records cannot be undefined')

    return this.serializer.serialize(castTypes(records, this.schema))
  }

  /**
   * De-Serializer
   */
  deserialize (dataSet, cb) {
    this.deserializer.deserialize(dataSet, (err, data) => {
      if (err) return cb(err)

      // jsonapi-serializer@3.0.0 doesn't obey "keyForAttribute: 'camelCase'"
      camelCaseKeys(data)

      // return deserialized 'data' with camelCased keys
      cb(null, data)
    })
  }
}

module.exports = BaseModel
