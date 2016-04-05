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

  for (let key in obj) {
    const val = obj[key]

    if (typeof val === 'object') { // relations
      if (val.belongsTo) {
        val.fkAs = val.fkAs || foreignKey(val.belongsTo)
      }

      this.relations[key] = val
    } else {
      this.dataFields[key] = val
      this.dataFieldsNames.push(key)
    }
  }
}

module.exports = Schema
