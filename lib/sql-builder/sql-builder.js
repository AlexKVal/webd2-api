'use strict'
const debug = require('debug')('webd2-api:sqlBuilder')
const {omit, pickBy, transform} = require('lodash')

const {getBelongsToRelations} = require('./belongsto-relations')


function quoteValueIfString (fieldType, fieldValue) {
  if (fieldValue == null) throw new Error('value for SQL query cannot be null or undefined')

  switch (fieldType) {
    case 'boolean':
    case 'integer':
      /**
       * boolean, integer etc.
       * pvsw accepts 'false' and '333' w/o problem
       */
      return fieldValue

    case 'string':
    default:
      /**
       * values from fields that are not described in the scheme
       * are treated as strings
       */
      return "'" + String(fieldValue).replace(/'/g, ' ') + "'"
  }
}

class SqlBuilder {
  constructor (schemaObject) {
    this.idFieldName = schemaObject.id || 'id'
    this.idFieldClause = schemaObject.id ? `${schemaObject.id} as id` : 'id'

    this.tableName = schemaObject.tableName

    this.schemaObject = omit(schemaObject, ['id', 'tableName'])

    this.columns = pickBy(this.schemaObject, (columnDescriptor, columnName) => {
      return typeof columnDescriptor !== 'object'
    })

    this.columnsNames = Object.keys(this.columns)
  }

  _getRelations () {
    return getBelongsToRelations(this.schemaObject)
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

  // idFieldClause) {
  //   return this.altIdFieldName ? `${this.altIdFieldName} as id` : 'id'
  // }

  /**
   * Lines of fields for SELECT queries
   *
   * SELECT PersID as id,
   * name, cardcode,       // columns
   * GrpID as userGroupId, // foreign key
   * rights as rightsId   // foreign key
   *
   * generateSelectFieldsPart() => '<all fields>'
   * generateSelectFieldsPart(['name', 'hide']) => 'name, hide'
   * generateSelectFieldsPart('name') => 'name'
   * special case when we need just 'id' value(s)
   * generateSelectFieldsPart('id') => 'PersID as id'
   */
  generateSelectFieldsPart (fieldsOnly) {
    const idFieldPart = [this.idFieldClause]

    if (!fieldsOnly) {
      return idFieldPart.concat(this.columnsNames, this._generateForeignKeysLines()).join(', ')
    }

    if (fieldsOnly === 'id') {
      return this.idFieldClause
    }

    return idFieldPart.concat(fieldsOnly).join(', ')
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
    return `SELECT ${this.idFieldClause}` +
    ` FROM ${this.getTableName()}` +
    ` WHERE ${this.idFieldName}=${id}`
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
        memo.push(quoteValueIfString(this.schemaObject[fieldName], data[fieldName]))
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

  _wherePart (whereOptions) {
    return transform(whereOptions, (memo, value, fieldName) => {
      const fieldValue = quoteValueIfString(this.schemaObject[fieldName], value)
      memo.push(`${fieldName}=${fieldValue}`)
    }, [])
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
      query += ` WHERE ${this._wherePart(options.where).join(' AND ')}`
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
   * {where: {hide: false, password: '123'}} - this is used when we need
   * additional checks by sql-engine (e.g. passwords)
   *   e.g. {id: '134', where: {hide: false, password: '123'}}
   */
  selectOne (options) {
    if (!options || !options.id && !options.data) {
      throw new Error('either `id` or `data` option should be provided')
    }

    if (options.id && options.data) {
      throw new Error('both `id` and `data` options are provided')
    }

    if (options.data && options.where) {
      throw new Error('`where` can be used only with `id` option')
    }

    let query = `SELECT ${this.generateSelectFieldsPart(options.fieldsOnly)}` +
    ` FROM ${this.getTableName()}`

    if (options.id) {
      query += ` WHERE ${this.idFieldName}=${options.id}`
    }

    if (options.where) {
      query += ` AND ${this._wherePart(options.where).join(' AND ')}`
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
    ` WHERE ${this.idFieldName}=${id}`
  }

}

SqlBuilder.quoteValueIfString = quoteValueIfString

module.exports = SqlBuilder
