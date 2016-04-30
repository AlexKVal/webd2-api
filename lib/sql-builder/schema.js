'use strict'
const {omit} = require('lodash')
const foreignKey = require('./foreign-key')
const {getBelongsToRelations} = require('./belongsto-relations')

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

  this.getBelongsToRelations = function () {
    return getBelongsToRelations(this.schemaObject)
  }
}

module.exports = Schema
