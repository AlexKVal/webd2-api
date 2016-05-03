'use strict'
const debug = require('debug')('webd2-api:model')
const { omit } = require('lodash')
const { NotFoundError } = require('jsonapi-errors/lib/errors')

const SqlBuilder = require('../sql-builder/sql-builder')
const {castTypesRows, castTypesRow} = require('../utils/cast-types')

class BaseModel {
  constructor ({db, name, schema}) {
    if (this.constructor === BaseModel) throw new TypeError('BaseModel is abstract class')

    if (!db) throw new Error('database is undefined')
    if (!name) throw new Error('name is undefined')
    if (!schema) throw new Error('schema is not provided')

    this.db = db
    this.name = name

    if (schema && !(schema instanceof Object)) {
      throw new TypeError('schema attribute should be an object')
    }

    this.schema = schema

    this.sqlBuilder = new SqlBuilder(schema)

    this.attributesSerialize = Object.keys(omit(schema, ['id', 'tableName']))
  }

  /**
   * methods that return rows with cast types
   */
  selectMany (options) {
    debug(`${this.name}:selectMany`)
    return this.db.exec(this.sqlBuilder.selectMany(options))
    .then((rows) => castTypesRows(rows, this.schema))
  }

  selectOne (options) {
    debug(`${this.name}:selectOne(${options && (options.data ? '<by data>' : options.id)})`)

    return this.db.exec(this.sqlBuilder.selectOne(options))
    .then((rows) => {
      if (!rows || rows.length === 0) throw new NotFoundError('db returned no data')
      return castTypesRow(rows[0], this.schema)
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
        return castTypesRow(rows[0], this.schema)
      })
    })
  }
}

module.exports = BaseModel
