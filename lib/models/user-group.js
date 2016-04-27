'use strict'

const db = require('../utils/database').getDatabase()
const BaseModel = require('./base-model')

const {filter} = require('lodash')
const pluralize = require('pluralize')
const Serializer = require('jsonapi-serializer').Serializer
const foreignKey = require('../sql-builder/foreign-key')

class UserGroup extends BaseModel {
  fetchHasMany (relationModel) {
    const relationName = pluralize(relationModel.name)
    const fkName = foreignKey(this.name)

    return Promise.all([ this.all(), relationModel.all() ])
      .then(([modelRows, relationRows]) => {
        const dataSet = modelRows.map((row) => {
          row[relationName] = filter(relationRows, [fkName, row.id])
          return row
        })

        const options = { attributes: this.sqlBuilder.columnsNames.concat(relationName) }
        options[relationName] = { ref: 'id', attributes: relationModel.sqlBuilder.columnsNames }
        const serializer = new Serializer(model.name, options)

        return serializer.serialize(dataSet)
      })
  }
}

const model = new UserGroup(db, 'user-group', {
  tableName: 'sPepTree',
  id: 'GrpID',
  name: 'string'
})

module.exports = model
