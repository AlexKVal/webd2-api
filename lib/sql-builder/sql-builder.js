'use strict'
const {camelCase, omit, pickBy, transform} = require('lodash')

const foreignKey = require('./foreign-key')

class SqlBuilder {
  constructor (descriptors) {
    this.id = descriptors.id
    this.tableName = descriptors.tableName

    this.descriptors = omit(descriptors, ['id', 'tableName'])

    this.columns = pickBy(this.descriptors, (columnDescriptor, columnName) => {
      return typeof columnDescriptor !== 'object'
    })

    this.columnsNames = Object.keys(this.columns)
  }

  _getRelations () {
    if (this._relationsCache) return this._relationsCache

    this._relationsCache = transform(this.descriptors, (memo, descriptor, modelFieldName) => {
      if (typeof descriptor === 'object') {
        if (descriptor.belongsTo) {
          const relation = descriptor.belongsTo
          const fkField = descriptor.fkField || camelCase(relation.name)
          const fkAs = descriptor.fkAs || foreignKey(relation.name)
          memo.push({
            modelFieldName,
            fkField,
            fkAs
          })
        }
      }
    }, [])

    return this._relationsCache
  }

  _getRelationsLinesForUpdate (data) {
    return this._getRelations().map((rel) => `${rel.fkField}=${data[rel.modelFieldName].id}`)
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
    .concat(this._getRelationsLinesForUpdate(data))
  }

  _generateForeignKeysLines () {
    return this._getRelations().map((rel) => `${rel.fkField} as ${rel.fkAs}`)
  }

  getIdFieldName () {
    return this.id || 'id'
  }

  getIdFieldLine () {
    const idAs = this.id
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
    const tableName = this.tableName
    if (!tableName) throw new TypeError('tableName is not provided')
    return tableName
  }

  sqlAll () {
    return `SELECT ${this.generateSelectFieldsPart()} FROM ${this.getTableName()}`
  }

  sqlOne (id) {
    return `SELECT ${this.generateSelectFieldsPart()}` +
    ` FROM ${this.getTableName()}` +
    ` WHERE ${this.getIdFieldName()}=${id}`
  }

  sqlIsRowExist (id) {
    return `SELECT ${this.getIdFieldLine()}` +
    ` FROM ${this.getTableName()}` +
    ` WHERE ${this.getIdFieldName()}=${id}`
  }

}

module.exports = SqlBuilder
