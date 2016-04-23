'use strict'
const {pickBy, transform} = require('lodash')

class SqlBuilder {
  constructor (schema) {
    const descriptors = schema.descriptors

    this.columns = pickBy(descriptors, (columnDescriptor, columnName) => {
      return typeof columnDescriptor !== 'object'
    })

    this.columnsNames = Object.keys(this.columns)
  }

  generateUpdateSetPart (data) {
    return transform(this.columns, (linesArray, fieldDescriptor, fieldName) => {
      let fieldData
      if (fieldDescriptor === 'string') {
        const value = data[fieldName] == null ? '' : data[fieldName]
        fieldData = "'" + String(value).replace(/'/g, ' ') + "'"
      } else { // 'number', 'boolean' as is
        fieldData = data[fieldName]
      }

      linesArray.push(`${fieldName}=${fieldData}`)
    }, [])
  }
}

module.exports = SqlBuilder
