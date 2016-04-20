'use strict'

const _ = require('lodash')
const pluralize = require('pluralize')
const JSONAPISerializer = require('jsonapi-serializer').Serializer

const foreignKey = require('../sql-builder/foreign-key')

function fetchHasManyRelation ({model, hasMany}) {
  const relationName = pluralize(hasMany.name)
  const fkName = foreignKey(model.name)

  return Promise.all([ model.all(), hasMany.all() ])
    .then(([modelRows, relationRows]) => {
      const dataSet = modelRows.map((row) => {
        row[relationName] = _.filter(relationRows, [fkName, row.id])
        return row
      })

      const options = { attributes: model.schema.dataFieldsNames.concat(relationName) }
      options[relationName] = { ref: 'id', attributes: hasMany.schema.dataFieldsNames }
      const serializer = new JSONAPISerializer(model.name, options)

      return serializer.serialize(dataSet)
    })
}

module.exports = {
  fetchHasManyRelation
}
