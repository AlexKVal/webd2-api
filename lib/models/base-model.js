'use strict'
const debug = require('debug')('webd2-api:model')
const { find } = require('lodash')
const { NotFoundError } = require('jsonapi-errors/lib/errors')
const Serializer = require('jsonapi-serializer').Serializer
const Deserializer = require('jsonapi-serializer').Deserializer
const pluralize = require('pluralize')

const Schema = require('../sql-builder/Schema')
const {castTypes, castTypesRows, castTypesRow} = require('../utils/cast-types')
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

    /**
     * Serializer
     */
    const serializerWithoutRelatedOptions = { attributes: this.schema.attributes.slice() } // copy
    this.schema.belongsToRelations.forEach((rel) => {
      serializerWithoutRelatedOptions[rel.name] = {
        ref: 'id',
        included: false,
        attributes: rel.relationModel.schema.attributes
      }
    })
    this.serializerWithoutRelated = new Serializer(this.name, serializerWithoutRelatedOptions)

    const serializerWithRelatedOptions = { attributes: this.schema.attributes.slice() } // copy
    this.schema.belongsToRelations.forEach((rel) => {
      serializerWithRelatedOptions[rel.name] = {
        ref: 'id',
        included: true,
        attributes: rel.relationModel.schema.attributes
      }
    })
    this.serializerWithRelated = new Serializer(this.name, serializerWithRelatedOptions)

    /**
     * Deserializer
     */
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
  apiFetchAll (options) {
    debug(`${this.name}:apiFetchAll`)

    options = options || {}

    return this.all()
    .then((records) => castTypes(records, this.schema))
    .then((parentRows) => {
      if (options.withRelated) {
        return this._fetchBelongsToRelations(parentRows)
      } else {
        return this._transformRelIDsToRelations(parentRows)
      }
    })
    .then((dataSet) => {
      if (options.withRelated) {
        return this.serializerWithRelated.serialize(dataSet)
      } else {
        return this.serializerWithoutRelated.serialize(dataSet)
      }
    })
  }

  _fetchBelongsToRelations (parentRows) {
    return Promise.all(this.schema.belongsToRelations.map((rel) => {
      return rel.relationModel.all()
      .then((rows) => castTypesRows(rows, rel.relationModel.schema))
      .then((castRows) => {
        return {
          name: rel.name,
          fkName: rel.fkName,
          rows: castRows
        }
      })
    }))
    .then((relationsWithData) => {
      return parentRows.map((parentRow) => {
        relationsWithData.forEach((rel) => {
          parentRow[rel.name] = find(rel.rows, { id: parentRow[rel.fkName] })
          delete parentRow[rel.fkName]
        })
        return parentRow
      })
    })
  }

  _transformRelIDsToRelations (parentRows) {
    return parentRows.map((parentRow) => {
      this.schema.belongsToRelations.forEach((rel) => {
        parentRow[rel.name] = { id: parentRow[rel.fkName] }
        delete parentRow[rel.fkName]
      })
      return parentRow
    })
  }

  apiFind (id) {
    debug(`${this.name}:apiFind(${id})`)

    return this.get(id)
    .then((record) => [ castTypesRow(record, this.schema) ])
    .then((parentRows) => this._transformRelIDsToRelations(parentRows))
    .then((dataSet) => this.serializerWithoutRelated.serialize(dataSet[0]))
  }

  apiUpdate (id, updates) {
    debug(`${this.name}:apiUpdate(${id})`)

    return new Promise((resolve, reject) => {
      this.deserialize(updates, (error, deserializedData) => {
        if (error) {
          reject(error)
        } else {
          this.update(id, deserializedData)
          .then((record) => [ castTypesRow(record, this.schema) ])
          .then((parentRows) => this._transformRelIDsToRelations(parentRows))
          .then((dataSet) => this.serializerWithoutRelated.serialize(dataSet[0]))
          .then(resolve)
          .catch(reject)
        }
      })
    })
  }

  apiCreate (newData) {
    debug(`${this.name}:apiCreate`)

    return new Promise((resolve, reject) => {
      this.deserialize(newData, (error, deserializedData) => {
        if (error) {
          reject(error)
        } else {
          this.create(deserializedData)
          .then((record) => [ castTypesRow(record, this.schema) ])
          .then((parentRows) => this._transformRelIDsToRelations(parentRows))
          .then((dataSet) => this.serializerWithoutRelated.serialize(dataSet[0]))
          .then(resolve)
          .catch(reject)
        }
      })
    })
  }

  /**
   * Serializer
   */
  serialize (records) {
    if (records == null) throw new Error('model.serialize() records cannot be undefined')

    return this.serializerWithoutRelated.serialize(castTypes(records, this.schema))
  }

  /**
   * Deserializer
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
