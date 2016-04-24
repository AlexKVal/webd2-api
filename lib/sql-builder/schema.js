'use strict'
const {transform} = require('lodash')
const foreignKey = require('../sql-builder/foreign-key')

/**
 * Constructor
 */
function Schema (descriptors) {
  if (!(this instanceof Schema)) {
    return new Schema(descriptors)
  }

  this.descriptors = descriptors

  this.attributes = []

  for (let key in descriptors) {
    const descriptor = descriptors[key]

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

    this._belongsToRelationsCache = transform(this.descriptors, (memo, descriptor, fieldName) => {
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
