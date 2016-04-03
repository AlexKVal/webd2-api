'use strict'

const _ = require('lodash')
const pluralize = require('pluralize')
const JSONAPISerializer = require('jsonapi-serializer').Serializer

const foreignKey = require('../sql-builder/foreign-key')
const {castTypesRows} = require('./cast-types')

function fetchBelongsToRelation ({model, belongsTo, query}) {
  const relationName = belongsTo.name
  const fkName = foreignKey(relationName)

  return Promise.all([ model.all(query), belongsTo.all() ])
    .then(([modelRows, relationRows]) => {
      const castModelRows = castTypesRows(modelRows, model.schema)
      const castRelationRows = castTypesRows(relationRows, belongsTo.schema)

      const dataSet = castModelRows.map((row) => {
        row[relationName] = _.find(castRelationRows, {'id': row[fkName]})
        return row
      })

      const options = { attributes: model.fields.concat(relationName) }
      options[relationName] = { ref: 'id', attributes: belongsTo.fields }
      const serializer = new JSONAPISerializer(model.name, options)

      return serializer.serialize(dataSet)
    })
}

function fetchHasManyRelation ({model, hasMany}) {
  const relationName = pluralize(hasMany.name)
  const fkName = foreignKey(model.name)

  return Promise.all([ model.all(), hasMany.all() ])
    .then(([modelRows, relationRows]) => {
      const castModelRows = castTypesRows(modelRows, model.schema)
      const castRelationRows = castTypesRows(relationRows, hasMany.schema)

      const dataSet = castModelRows.map((row) => {
        row[relationName] = _.filter(castRelationRows, [fkName, row.id])
        return row
      })

      const options = { attributes: model.fields.concat(relationName) }
      options[relationName] = { ref: 'id', attributes: hasMany.fields }
      const serializer = new JSONAPISerializer(model.name, options)

      return serializer.serialize(dataSet)
    })
}

module.exports = {
  fetchBelongsToRelation,
  fetchHasManyRelation
}
