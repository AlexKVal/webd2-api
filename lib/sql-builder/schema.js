'use strict'

/**
 * Constructor
 */
function Schema (obj) {
  if (!(this instanceof Schema)) {
    return new Schema(obj)
  }

  this.dataFields = {}
  // this.relations = {}

  for (let key in obj) {
    const val = obj[key]

    if (typeof val === 'object') continue // relations

    this.dataFields[key] = val
  }
}

module.exports = Schema
