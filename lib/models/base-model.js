'use strict'

/**
 * the path should be the same as in the tests for them to work
 * "instanceof" and different require() paths
 * http://stackoverflow.com/questions/18261788/nodejs-require-instanceof-behaviour#comment59261548_32725696
 */
const Schema = require('../../lib/sql-builder/Schema')

class BaseModel {
  constructor (name, schema) {
    if (this.constructor === BaseModel) throw new TypeError('BaseModel is abstract class')

    if (!name) throw new Error('name is undefined')

    this.name = name

    this.schema = schema || new Schema({})
  }
}

module.exports = BaseModel
