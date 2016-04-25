'use strict'
const {omit, pickBy, transform} = require('lodash')

class SqlBuilder {
  constructor (schema) {
    this.schema = schema

    this.columns = pickBy(omit(schema.descriptors, 'id'), (columnDescriptor, columnName) => {
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

  _generateForeignKeysLines () {
    return this.schema.getBelongsToRelations().map((rel) => {
      return `${rel.fkField} as ${rel.fkName}`
    })
  }

  getIdFieldName () {
    return this.schema.descriptors.id || 'id'
  }

  getIdFieldLine () {
    const idAs = this.schema.descriptors.id
    return idAs ? `${idAs} as id` : 'id'
  }

  /**
   * Lines of fields for SELECT queries
   *
   * SELECT PersID as id,
   * name, cardcode,       // columns
   * GrpID as userGroupId, // foreign key
   * rights as rightsId   // foreign key
   */
  generateSelectFieldsPart () {
    const idFieldLine = [this.getIdFieldLine()]
    return idFieldLine.concat(this.columnsNames, this._generateForeignKeysLines()).join(', ')
  }
}

module.exports = SqlBuilder
