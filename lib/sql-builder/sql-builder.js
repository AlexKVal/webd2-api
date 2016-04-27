'use strict'
const {camelCase, omit, pickBy, transform} = require('lodash')

const foreignKey = require('./foreign-key')


function quoteValueIfString (fieldDescriptor, fieldValue) {
  if (fieldValue == null) throw new Error('value for SQL query cannot be null or undefined')

  switch (fieldDescriptor) {
    case 'string':
      return "'" + String(fieldValue).replace(/'/g, ' ') + "'"
    default:
      /**
       * boolean, integer etc.
       * pvsw accepts 'false' and '333' w/o problem
       */
      return fieldValue
  }
}

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
    return this._getRelations()
    .filter((rel) => data[rel.modelFieldName] != null)
    .map((rel) => `${rel.fkField}=${data[rel.modelFieldName].id}`)
  }

  generateFieldEqualsDataLines (data) {
    return transform(this.columns, (linesArray, fieldDescriptor, fieldName) => {
      if (data[fieldName] != null) {
        const fieldValue = quoteValueIfString(fieldDescriptor, data[fieldName])
        linesArray.push(`${fieldName}=${fieldValue}`)
      }
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
  generateSelectFieldsPart (fieldsOnly) {
    const idFieldLine = [this.getIdFieldLine()]
    const columnsNames = fieldsOnly || this.columnsNames
    return idFieldLine.concat(columnsNames, this._generateForeignKeysLines()).join(', ')
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

  sqlUpdate (id, data) {
    return `UPDATE ${this.getTableName()}` +
    ` SET ${this.generateFieldEqualsDataLines(data).join(', ')}` +
    ` WHERE ${this.getIdFieldName()}=${id}`
  }

  sqlOneByData (data) {
    return `SELECT ${this.generateSelectFieldsPart()}` +
    ` FROM ${this.getTableName()}` +
    ` WHERE ${this.generateFieldEqualsDataLines(data).join(' AND ')}`
  }

  _fieldsNamesForInsert (data) {
    const dataFields = this.columnsNames.filter((fieldName) => data[fieldName] != null)

    const presentRelations = this._getRelations().filter((rel) => data[rel.modelFieldName] != null)
    const relationsFields = presentRelations.map((rel) => rel.fkField)

    return dataFields.concat(relationsFields)
  }

  _fieldsValuesForInsert (data) {
    const dataFieldsValues = this.columnsNames.reduce((memo, fieldName) => {
      if (data[fieldName] != null) {
        memo.push(quoteValueIfString(this.descriptors[fieldName], data[fieldName]))
      }
      return memo
    }, [])

    const relationsIds = this._getRelations().reduce((memo, rel) => {
      const embeddedRelation = data[rel.modelFieldName]
      if (embeddedRelation != null) memo.push(embeddedRelation.id)
      return memo
    }, [])

    return dataFieldsValues.concat(relationsIds)
  }

  sqlCreate (data) {
    return `INSERT INTO ${this.getTableName()}` +
    ` (${this._fieldsNamesForInsert(data).join(', ')})` +
    ` VALUES (${this._fieldsValuesForInsert(data).join(', ')})`
  }
}

SqlBuilder.quoteValueIfString = quoteValueIfString

module.exports = SqlBuilder
