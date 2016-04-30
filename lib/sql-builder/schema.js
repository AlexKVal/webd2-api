'use strict'
const {omit, transform} = require('lodash')
const foreignKey = require('../sql-builder/foreign-key')

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

  this._belongsToRelationsCache = null
  this.getBelongsToRelations = function getBelongsToRelations () {
    if (this._belongsToRelationsCache) return this._belongsToRelationsCache

    this._belongsToRelationsCache = transform(this.schemaObject, (memo, descriptor, fieldName) => {
      if (typeof descriptor === 'object') { // relations
        if (descriptor.belongsTo) {
          const relationModel = descriptor.belongsTo

          memo.push({
            name: fieldName,
            relationModel: relationModel,
            fkField: descriptor.fkField,
            fkName: descriptor.fkAs || foreignKey(relationModel.name)
          })
        }
      }
    }, [])

    return this._belongsToRelationsCache
  }
}

module.exports = Schema
