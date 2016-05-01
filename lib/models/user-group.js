'use strict'

const registry = require('./registry')
const BaseModel = require('./base-model')

const {filter} = require('lodash')
const pluralize = require('pluralize')
const Serializer = require('jsonapi-serializer').Serializer
const foreignKey = require('../sql-builder/foreign-key')

class UserGroup extends BaseModel {
  fetchHasMany (relationModelName) {
    const pluralRelationName = pluralize(relationModelName)
    const fkName = foreignKey(this.name)
    const relationModel = registry.model(relationModelName)

    return Promise.all([ this.selectMany(), relationModel.selectMany() ])
      .then(([modelRows, relationRows]) => {
        const dataSet = modelRows.map((row) => {
          row[pluralRelationName] = filter(relationRows, [fkName, row.id])
          return row
        })

        const options = { attributes: this.sqlBuilder.columnsNames.concat(pluralRelationName) }
        options[pluralRelationName] = { ref: 'id', attributes: relationModel.sqlBuilder.columnsNames }
        const serializer = new Serializer(this.name, options)

        return serializer.serialize(dataSet)
      })
  }
}

UserGroup.schemaObject = {
  tableName: 'sPepTree',
  id: 'GrpID',
  name: 'string'
}

module.exports = registry.model('userGroup', UserGroup)
