'use strict'

const _ = require('lodash')
const pluralize = require('pluralize')
const JSONAPISerializer = require('jsonapi-serializer').Serializer

const foreignKey = require('../sql-builder/foreign-key')
const {castTypes} = require('./cast-types')

function fetchBelongsToRelation ({model, belongsTo, query}) {
  const relationName = belongsTo.name
  const fkName = foreignKey(relationName)

  return Promise.all([ model.all(query), belongsTo.all() ])
    .then(([modelRows, relationRows]) => {
      const castModelRows = castTypes(modelRows, model.schema)
      const castRelationRows = castTypes(relationRows, belongsTo.schema)

      const dataSet = castModelRows.map((row) => {
        row[relationName] = _.find(castRelationRows, {'id': row[fkName]})
        return row
      })

      const options = { attributes: model.schema.dataFieldsNames.concat(relationName) }
      options[relationName] = { ref: 'id', attributes: belongsTo.schema.dataFieldsNames }
      const serializer = new JSONAPISerializer(model.name, options)

      return serializer.serialize(dataSet)
    })
}

function fetchHasManyRelation ({model, hasMany}) {
  const relationName = pluralize(hasMany.name)
  const fkName = foreignKey(model.name)

  return Promise.all([ model.all(), hasMany.all() ])
    .then(([modelRows, relationRows]) => {
      const castModelRows = castTypes(modelRows, model.schema)
      const castRelationRows = castTypes(relationRows, hasMany.schema)

      const dataSet = castModelRows.map((row) => {
        row[relationName] = _.filter(castRelationRows, [fkName, row.id])
        return row
      })

      const options = { attributes: model.schema.dataFieldsNames.concat(relationName) }
      options[relationName] = { ref: 'id', attributes: hasMany.schema.dataFieldsNames }
      const serializer = new JSONAPISerializer(model.name, options)

      return serializer.serialize(dataSet)
    })
}

module.exports = {
  fetchBelongsToRelation,
  fetchHasManyRelation
}
