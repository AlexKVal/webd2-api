'use strict'
const debug = require('debug')('webd2-api:model')
const { find } = require('lodash')
const { NotFoundError } = require('jsonapi-errors/lib/errors')
const Serializer = require('jsonapi-serializer').Serializer
const Deserializer = require('jsonapi-serializer').Deserializer
const pluralize = require('pluralize')

const Schema = require('../sql-builder/Schema')
const SqlBuilder = require('../sql-builder/sql-builder')
const {castTypesRows} = require('../utils/cast-types')
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
    this.sqlBuilder = new SqlBuilder(this.schema)

    /**
     * Serializer
     */
    function createSerializerFor (model, relatedIncluded) {
      const options = { attributes: model.schema.attributes.slice() } // copy
      model.schema.getBelongsToRelations().forEach((rel) => {
        options[rel.name] = {
          ref: 'id',
          included: relatedIncluded,
          attributes: rel.relationModel.schema.attributes
        }
      })
      return new Serializer(model.name, options)
    }

    this.serializerWithoutRelated = createSerializerFor(this, false)
    this.serializerWithRelated = createSerializerFor(this, true)

    /**
     * Deserializer
     */
    this.deserializerOptions = {
      keyForAttribute: 'camelCase'
    }

    this.schema.getBelongsToRelations().forEach((relation) => {
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
   * methods that return rows with cast types
   */
  all () {
    debug(`${this.name}:all`)
    return this.db.exec(this.sqlAll())
    .then((rows) => castTypesRows(rows, this.schema))
  }

  get (id) {
    if (id == null) throw new Error('no id has been provided')
    debug(`${this.name}:get${id}`)

    return this.db.exec(this.sqlOne(id))
    .then((rows) => {
      if (!rows || rows.length === 0) throw new NotFoundError('db returned no data')
      return castTypesRows(rows, this.schema)
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
        return castTypesRows(rows, this.schema)
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
    .then((parentRows) => {
      if (options.withRelated) {
        return this._fetchRelations(parentRows)
      } else {
        return this._joinRelations(parentRows)
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

  _fetchRelations (parentRows) {
    return Promise.all(this.schema.getBelongsToRelations().map((rel) => {
      return rel.relationModel.all()
      .then((castRows) => {
        return {
          name: rel.name,
          fkName: rel.fkName,
          rows: castRows
        }
      })
    }))
    .then((relationsData) => this._joinRelations(parentRows, relationsData))
  }

  _joinRelations (parentRows, relations) {
    relations = relations || this.schema.getBelongsToRelations()

    return parentRows.map((parentRow) => {
      relations.forEach((rel) => {
        if (rel.rows) {
          parentRow[rel.name] = find(rel.rows, { id: parentRow[rel.fkName] })
        } else {
          parentRow[rel.name] = { id: parentRow[rel.fkName] }
        }
        delete parentRow[rel.fkName]
      })
      return parentRow
    })
  }

  /**
   * handles a one-row Array dataSet[0]
   * thus used in apiMethods that return only one row
   */
  _joinRelationsAndSerialize (records) {
    const dataSet = this._joinRelations(records)
    return this.serializerWithoutRelated.serialize(dataSet[0])
  }

  apiFind (id) {
    debug(`${this.name}:apiFind(${id})`)

    return this.get(id)
    .then((records) => this._joinRelationsAndSerialize(records))
  }

  apiUpdate (id, updates) {
    debug(`${this.name}:apiUpdate(${id})`)

    return this.deserialize(updates)
    .then((deserializedData) => this.update(id, deserializedData))
    .then((records) => this._joinRelationsAndSerialize(records))
  }

  apiCreate (newData) {
    debug(`${this.name}:apiCreate`)

    return this.deserialize(newData)
    .then((deserializedData) => this.create(deserializedData))
    .then((records) => this._joinRelationsAndSerialize(records))
  }

  /**
   * Deserializer
   */
  deserialize (dataSet) {
    return new Promise((resolve, reject) => {
      this.deserializer.deserialize(dataSet, (error, deserializedData) => {
        if (error) reject(error)

        // jsonapi-serializer@3.0.0 doesn't obey "keyForAttribute: 'camelCase'"
        camelCaseKeys(deserializedData)

        // return deserialized 'data' with camelCased keys
        resolve(deserializedData)
      })
    })
  }
}

module.exports = BaseModel
