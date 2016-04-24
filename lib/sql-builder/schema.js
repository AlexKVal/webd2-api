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

  this.relations = {}

  this.attributes = []

  for (let key in descriptors) {
    const descriptor = descriptors[key]

    if (typeof descriptor === 'object') { // relations
      if (descriptor.belongsTo) {
        const relationModel = descriptor.belongsTo
        if (!(relationModel instanceof Object) || (typeof relationModel.name) !== 'string') {
          throw new TypeError('belongsTo should be a model')
        }
        descriptor.fkAs = descriptor.fkAs || foreignKey(relationModel.name)
        this.attributes.push(descriptor.fkAs)
        this.attributes.push(key)
      }

      this.relations[key] = descriptor
    } else { // data fields
      this.attributes.push(key)
    }
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
