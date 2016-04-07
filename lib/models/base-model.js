'use strict'

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

  all (query) {
    return this.db.exec()
  }
}

module.exports = BaseModel
