'use strict'
const {omit, pickBy, transform} = require('lodash')

const foreignKey = require('./foreign-key')

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
    if (this._foreignKeysLinesCache) return this._foreignKeysLinesCache

    this._foreignKeysLinesCache = transform(this.schema.descriptors, (memo, descriptor, fieldName) => {
      if (typeof descriptor === 'object') {
        if (descriptor.belongsTo) {
          const relationModel = descriptor.belongsTo

          memo.push(`${descriptor.fkField} as ${descriptor.fkAs || foreignKey(relationModel.name)}`)
        }
      }
    }, [])

    return this._foreignKeysLinesCache
  }

  getIdFieldName () {
    return this.schema.id || 'id'
  }

  getIdFieldLine () {
    const idAs = this.schema.id
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

  getTableName () {
    const tableName = this.schema.tableName
    if (!tableName) throw new TypeError('tableName is not provided')
    return tableName
  }
}

module.exports = SqlBuilder
