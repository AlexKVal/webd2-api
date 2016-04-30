'use strict'
const {omit} = require('lodash')
const foreignKey = require('./foreign-key')

/**
 * Constructor
 */
function Schema (schemaObject) {
  if (!(this instanceof Schema)) {
    return new Schema(schemaObject)
  }

  this.id = schemaObject.id
  this.tableName = schemaObject.tableName
  this.schemaObject = omit(schemaObject, ['id', 'tableName'])

  this.attributes = []

  for (let key in this.schemaObject) {
    const descriptor = schemaObject[key]

    if (typeof descriptor === 'object') { // relations
      const belongsToModel = descriptor.belongsTo
      if (belongsToModel) {
        this.attributes.push(descriptor.fkAs || foreignKey(belongsToModel.name))
      }
    }

    this.attributes.push(key)
  }
}

module.exports = Schema
