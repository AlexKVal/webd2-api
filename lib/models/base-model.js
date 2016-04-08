'use strict'
const debug = require('debug')('webd2-api:model')
const {
  DbError
} = require('jsonapi-errors/lib/errors')

/**
 * the path should be the same as in the tests for them to work
 * "instanceof" and different require() paths
 * http://stackoverflow.com/questions/18261788/nodejs-require-instanceof-behaviour#comment59261548_32725696
 */
const Schema = require('../../lib/sql-builder/Schema')

class BaseModel {
  constructor (db, name, schema) {
    if (this.constructor === BaseModel) throw new TypeError('BaseModel is abstract class')

    if (!db) throw new Error('database is undefined')
    if (!name) throw new Error('name is undefined')

    this.db = db
    this.name = name

    schema = schema || new Schema({})
    if (!(schema instanceof Schema) && !(schema instanceof Object)) {
      throw new TypeError('schema attribute should be an instance of Schema')
    }

    this.schema = (schema instanceof Schema) ? schema : new Schema(schema)
  }

  sqlAll () { throw new Error('you should override sqlAll') }
  sqlOne () { throw new Error('you should override sqlOne') }

  all () {
    debug(`${this.name}:all`)
    return this.db.exec(this.sqlAll())
    .catch((dbMsg) => Promise.reject(new DbError(dbMsg)))
  }

  get (id) {
    if (id == null) throw new Error('no id has been provided')
    debug(`${this.name}:get${id}`)

    return this.db.exec(this.sqlOne(id))
    .catch((dbMsg) => { throw new DbError(dbMsg) })
    // .then((rows) => {
    //   if (rows.length === 0) throw new NotFoundError('db returned an empty result')
    //
    //   return rows[0]
    // })
  }
}

module.exports = BaseModel
