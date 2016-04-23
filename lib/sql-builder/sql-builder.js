'use strict'
const {pickBy} = require('lodash')

class SqlBuilder {
  constructor (schema) {
    const descriptors = schema.descriptors

    this.columns = pickBy(descriptors, (columnDescriptor, columnName) => {
      return typeof columnDescriptor !== 'object'
    })

    this.columnsNames = Object.keys(this.columns)
  }
}

module.exports = SqlBuilder
