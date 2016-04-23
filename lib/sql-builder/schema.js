'use strict'
const foreignKey = require('../sql-builder/foreign-key')

/**
 * Constructor
 */
function Schema (descriptors) {
  if (!(this instanceof Schema)) {
    return new Schema(descriptors)
  }

  this.dataFields = {}
  this.dataFieldsNames = []

  this.relations = {}
  this.belongsToRelations = []

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

        this.getBelongsToRelations.push({
          name: key,
          relationModel: relationModel,
          fkName: descriptor.fkAs
        })
      }

      this.relations[key] = descriptor
    } else { // data fields
      this.dataFields[key] = descriptor
      this.dataFieldsNames.push(key)
      this.attributes.push(key)
    }
  }
}

module.exports = Schema
