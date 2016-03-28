'use strict'

const _ = require('lodash')
const pluralize = require('pluralize')
const JSONAPISerializer = require('jsonapi-serializer').Serializer

const foreignKey = require('./foreign-key')

function fetchBelongsToRelation ({model, belongsTo, query}) {
  const relationName = belongsTo.name
  const fkName = foreignKey(relationName)

  return Promise.all([ model.all(query), belongsTo.all() ])
    .then(([modelRows, relationRows]) => {
      const dataSet = modelRows.map((row) => {
        row[relationName] = _.find(relationRows, {'id': row[fkName]})
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
      const dataSet = modelRows.map((row) => {
        row[relationName] = _.filter(relationRows, [fkName, row.id])
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
