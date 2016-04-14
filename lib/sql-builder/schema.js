'use strict'
const foreignKey = require('../sql-builder/foreign-key')

/**
 * Constructor
 */
function Schema (obj) {
  if (!(this instanceof Schema)) {
    return new Schema(obj)
  }

  this.dataFields = {}
  this.dataFieldsNames = []

  this.relations = {}

  this.attributes = []

  for (let key in obj) {
    const val = obj[key]

    if (typeof val === 'object') { // relations
      if (val.belongsTo) {
        const relation = val.belongsTo
        if (!(relation instanceof Object) || (typeof relation.name) !== 'string') {
          throw new TypeError('belongsTo should be a model')
        }
        val.fkAs = val.fkAs || foreignKey(relation.name)
        this.attributes.push(val.fkAs)
      }

      this.relations[key] = val
    } else { // data fields
      this.dataFields[key] = val
      this.dataFieldsNames.push(key)
      this.attributes.push(key)
    }
  }
}

module.exports = Schema
