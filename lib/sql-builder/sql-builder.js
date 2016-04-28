'use strict'
const debug = require('debug')('webd2-api:sqlBuilder')
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

  /**
   * underlying sql-engine doesn't throw any error if row doesn't exist
   * this method aimed to fix this
   */
  sqlIsRowExist (id) {
    return `SELECT ${this.getIdFieldLine()}` +
    ` FROM ${this.getTableName()}` +
    ` WHERE ${this.getIdFieldName()}=${id}`
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

  /**
   * selectMany(options)
   * {} => SELECT <all fields> FROM <tableName>
   * {id: '12'} throws
   * {where: {hide: false}} => WHERE hide=false
   * {where: {hide: false, name: 'Vasya'}} => WHERE hide=false AND name='Vasya'
   * {orderBy: 'name DESC'} => ORDER BY name
   * {orderBy: 'name, rights DESC'} => ORDER BY name, rights
   * {orderBy: ['name', 'rights DESC']} => ORDER BY name, rights
   *
   * general options
   * {fieldsOnly: ['name', 'hide']}
   */
  selectMany (options) {
    options = options || {}
    if (options.id) throw new Error('it is wrong to pass the `id` option to selectMany')

    let query = `SELECT ${this.generateSelectFieldsPart(options.fieldsOnly)}` +
    ` FROM ${this.getTableName()}`

    if (options.where) {
      const clauses = transform(options.where, (memo, value, fieldName) => {
        const fieldValue = quoteValueIfString(this.descriptors[fieldName], value)
        memo.push(`${fieldName}=${fieldValue}`)
      }, [])

      query += ` WHERE ${clauses.join(' AND ')}`
    }

    if (options.orderBy) {
      const orderBy = Array.isArray(options.orderBy)
        ? options.orderBy.join(', ')
        : options.orderBy
      query += ` ORDER BY ${orderBy}`
    }

    debug(`selectMany:\n    ${query}`)
    return query
  }

  /**
   * selectOne(options)
   * {id: '12'} => WHERE PersID=12
   * {data: data} => WHERE name='admin' AND hide=false
   *
   * general options
   * {fieldsOnly: ['name', 'hide']}
   */
  selectOne (options) {
    if (!options || !options.id && !options.data) {
      throw new Error('either `id` or `data` option should be provided')
    }

    if (options.id && options.data) {
      throw new Error('both `id` and `data` options are provided')
    }

    let query = `SELECT ${this.generateSelectFieldsPart(options.fieldsOnly)}` +
    ` FROM ${this.getTableName()}`

    if (options.id) {
      query += ` WHERE ${this.getIdFieldName()}=${options.id}`
    }

    if (options.data) {
      query += ` WHERE ${this.generateFieldEqualsDataLines(options.data).join(' AND ')}`
    }

    debug(`selectOne:\n    ${query}`)
    return query
  }

  create (data) {
    return `INSERT INTO ${this.getTableName()}` +
    ` (${this._fieldsNamesForInsert(data).join(', ')})` +
    ` VALUES (${this._fieldsValuesForInsert(data).join(', ')})`
  }

  update (id, data) {
    return `UPDATE ${this.getTableName()}` +
    ` SET ${this.generateFieldEqualsDataLines(data).join(', ')}` +
    ` WHERE ${this.getIdFieldName()}=${id}`
  }

}

SqlBuilder.quoteValueIfString = quoteValueIfString

module.exports = SqlBuilder
