'use strict'
const debug = require('debug')('webd2-api:model')
const { find } = require('lodash')
const { NotFoundError } = require('jsonapi-errors/lib/errors')

const Schema = require('../sql-builder/Schema')
const SqlBuilder = require('../sql-builder/sql-builder')
const Serializer = require('../utils/serializer')
const {castTypesRows} = require('../utils/cast-types')

class BaseModel {
  constructor (db, name, descriptors) {
    if (this.constructor === BaseModel) throw new TypeError('BaseModel is abstract class')

    if (!db) throw new Error('database is undefined')
    if (!name) throw new Error('name is undefined')
    if (!descriptors) throw new Error('schema is not provided')

    this.db = db
    this.name = name

    if (descriptors && !(descriptors instanceof Object)) {
      throw new TypeError('descriptors attribute should be an object')
    }
    descriptors = descriptors || {}

    this.schema = new Schema(descriptors)
    this.sqlBuilder = new SqlBuilder(descriptors)

    this.serializer = new Serializer(this.name, this.schema)
  }

  /**
   * methods that return rows with cast types
   */
  all (options) {
    debug(`${this.name}:all`)
    return this.db.exec(this.sqlBuilder.selectMany(options))
    .then((rows) => castTypesRows(rows, this.schema))
  }

  get (options) {
    debug(`${this.name}:get(${options && (options.data ? '<by data>' : options.id)})`)

    return this.db.exec(this.sqlBuilder.selectOne(options))
    .then((rows) => {
      if (!rows || rows.length === 0) throw new NotFoundError('db returned no data')
      return castTypesRows(rows, this.schema)
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
      .then(() => this.get({id})) // return updated row
    })
  }

  create (data) {
    debug(`${this.name}:create`)

    return this.db.exec(this.sqlBuilder.create(data))
    .then(() => {
      return this.db.exec(this.sqlBuilder.selectOne({data}))
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
        return this.serializer.withRelated(dataSet)
      } else {
        return this.serializer.withoutRelated(dataSet)
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
    return this.serializer.withoutRelated(dataSet[0])
  }

  apiFind (id) {
    debug(`${this.name}:apiFind(${id})`)

    return this.get({id})
    .then((records) => this._joinRelationsAndSerialize(records))
  }

  apiUpdate (id, updates) {
    debug(`${this.name}:apiUpdate(${id})`)

    return this.serializer.deserialize(updates)
    .then((deserializedData) => this.update(id, deserializedData))
    .then((records) => this._joinRelationsAndSerialize(records))
  }

  apiCreate (newData) {
    debug(`${this.name}:apiCreate`)

    return this.serializer.deserialize(newData)
    .then((deserializedData) => this.create(deserializedData))
    .then((records) => this._joinRelationsAndSerialize(records))
  }
}

module.exports = BaseModel
