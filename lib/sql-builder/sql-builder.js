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

  generateUpdateSetPart (data) { // TODO use _.transform
    return Object.keys(this.columns).reduce((linesArray, fieldName) => {
      const fieldType = this.columns[fieldName]
      let fieldData
      switch (fieldType) {
        case 'string':
          const value = data[fieldName] == null ? '' : data[fieldName]
          fieldData = "'" + String(value).replace(/'/g, ' ') + "'"
          break
        default: // 'number', 'boolean' as is
          fieldData = data[fieldName]
      }

      linesArray.push(`${fieldName}=${fieldData}`)
      return linesArray
    }, [])
  }
}

module.exports = SqlBuilder
