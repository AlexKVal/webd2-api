'use strict'

/**
 * Constructor
 */
function Schema (obj) {
  if (!(this instanceof Schema)) {
    return new Schema(obj)
  }

  this.fields = {}
  // this.relations = {}
}

module.exports = Schema
