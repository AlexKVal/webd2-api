'use strict'
const debug = require('debug')('webd2-api:model')
const { find } = require('lodash')
const { NotFoundError } = require('jsonapi-errors/lib/errors')

const SqlBuilder = require('../sql-builder/sql-builder')
const {
  // attributesOfRelations,
  getBelongsToRelations
} = require('../sql-builder/belongsto-relations')
const Serializer = require('../utils/serializer')
const Deserializer = require('../utils/deserializer')
const {castTypesRows, castTypesRow} = require('../utils/cast-types')

class BaseModel {
  constructor ({db, name, schema: schemaObject, registry}) {
    if (this.constructor === BaseModel) throw new TypeError('BaseModel is abstract class')

    if (!db) throw new Error('database is undefined')
    if (!name) throw new Error('name is undefined')
    if (!schemaObject) throw new Error('schemaObject is not provided')

    this.db = db
    this.registry = registry
    this.name = name

    if (schemaObject && !(schemaObject instanceof Object)) {
      throw new TypeError('schemaObject attribute should be an object')
    }

    this.schemaObject = schemaObject

    this.sqlBuilder = new SqlBuilder(schemaObject)

    this.serializer = new Serializer({
      modelName: this.name,
      attributes: Object.keys(this.sqlBuilder.schemaObject),
      attributesOfRelations: {} // attributesOfRelations(registry, schemaObject)
    })

    const modelNamesOfRelations = getBelongsToRelations(schemaObject)
      .map((rel) => rel.relationModelName)
    this.deserializer = new Deserializer(modelNamesOfRelations)
  }

  /**
   * methods that return rows with cast types
   */
  selectMany (options) {
    debug(`${this.name}:selectMany`)
    return this.db.exec(this.sqlBuilder.selectMany(options))
    .then((rows) => castTypesRows(rows, this.sqlBuilder.schemaObject))
  }

  selectOne (options) {
    debug(`${this.name}:selectOne(${options && (options.data ? '<by data>' : options.id)})`)

    return this.db.exec(this.sqlBuilder.selectOne(options))
    .then((rows) => {
      if (!rows || rows.length === 0) throw new NotFoundError('db returned no data')
      return castTypesRow(rows[0], this.sqlBuilder.schemaObject)
    })
  }

  update (id, data) {
    if (id == null) throw new Error('no id has been provided')
    if (data == null) throw new Error('no data has been provided')
    debug(`${this.name}:update${id}`)

    return this.db.exec(this.sqlBuilder.sqlIsRowExist(id))
    .then((rows) => {
      if (rows.length === 0) throw new NotFoundError(`row with id: ${id} does not exist`)

      return this.db.exec(this.sqlBuilder.update(id, data))
      .then(() => this.selectOne({id})) // return updated row
    })
  }

  create (data) {
    debug(`${this.name}:create`)

    return this.db.exec(this.sqlBuilder.create(data))
    .then(() => {
      return this.db.exec(this.sqlBuilder.selectOne({data}))
      .then((rows) => {
        if (!rows || rows.length === 0) {
          throw new NotFoundError(`something went wrong with INSERT ${JSON.stringify(data)}`)
        }
        return castTypesRow(rows[0], this.sqlBuilder.schemaObject)
      })
    })
  }

  /**
   * methods that get and return JSONApi serialized data
   */
  apiFetchAll (options) {
    debug(`${this.name}:apiFetchAll`)

    options = options || {}

    return this.selectMany()
    .then((parentRows) => {
      if (options.withRelated) {
        return this._fetchRelations(parentRows)
      } else {
        return this._joinRelations(parentRows)
      }
    })
    .then((dataSet) => {
      if (options.withRelated) {
        return this.serializer.withRelated(dataSet)
      } else {
        return this.serializer.withoutRelated(dataSet)
      }
    })
  }

  _fetchRelations (parentRows) {
    return Promise.all(getBelongsToRelations(this.schemaObject).map((rel) => {
      return rel.relationModel.selectMany()
      .then((castRows) => {
        return {
          modelFieldName: rel.modelFieldName,
          fkAs: rel.fkAs,
          rows: castRows
        }
      })
    }))
    .then((relationsData) => this._joinRelations(parentRows, relationsData))
  }

  _joinRelations (parentRows, relations) {
    relations = relations || getBelongsToRelations(this.schemaObject)

    return parentRows.map((parentRow) => {
      relations.forEach((rel) => {
        if (rel.rows) {
          parentRow[rel.modelFieldName] = find(rel.rows, { id: parentRow[rel.fkAs] })
        } else {
          parentRow[rel.modelFieldName] = { id: parentRow[rel.fkAs] }
        }
        delete parentRow[rel.fkAs]
      })
      return parentRow
    })
  }

  /**
   * handles one row
   * thus used in apiMethods that return only one row
   */
  _joinRelationsAndSerialize (row) {
    const dataSet = this._joinRelations([row])
    return this.serializer.withoutRelated(dataSet[0])
  }

  apiFind (id) {
    debug(`${this.name}:apiFind(${id})`)

    return this.selectOne({id})
    .then((record) => this._joinRelationsAndSerialize(record))
  }

  apiUpdate (id, updates) {
    debug(`${this.name}:apiUpdate(${id})`)

    return this.deserializer.deserialize(updates)
    .then((deserializedData) => this.update(id, deserializedData))
    .then((record) => this._joinRelationsAndSerialize(record))
  }

  apiCreate (newData) {
    debug(`${this.name}:apiCreate`)

    return this.deserializer.deserialize(newData)
    .then((deserializedData) => this.create(deserializedData))
    .then((record) => this._joinRelationsAndSerialize(record))
  }
}

module.exports = BaseModel
