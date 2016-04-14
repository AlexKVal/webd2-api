'use strict'

const _ = require('lodash')
const pluralize = require('pluralize')
const JSONAPISerializer = require('jsonapi-serializer').Serializer

const foreignKey = require('../sql-builder/foreign-key')
const {castTypes} = require('./cast-types')
const registry = require('../models/registry')

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

function includeBelongsToRelations (model) {
  const relations = []
  const relationModels = []
  const promises = []

  promises.push(model.all())

  Object.keys(model.schema.relations).forEach((key) => {
    const relation = model.schema.relations[key]
    if (relation.belongsTo) {
      relations.push(relation)

      const relationModelName = relation.belongsTo
      const relationModel = registry[relationModelName]

      relationModels.push(relationModel)
      promises.push(relationModel.all())
    }
  })

  return Promise.all(promises)
  .then((arrayOfResults) => {
    const modelRows = arrayOfResults[0]
    const castModelRows = castTypes(modelRows, model.schema)

    let dataSet
    const options = { attributes: model.schema.dataFieldsNames.slice() } // clone array

    for (let i = 1; i < relationModels.length; i++) {
      const belongsTo = relationModels[i]
      const relationRows = arrayOfResults[i]
      const castRelationRows = castTypes(relationRows, belongsTo.schema)

      const relation = relations[i]
      const fkName = relation.fkAs
      const relationModelName = relation.belongsTo

      options.attributes.push(relationModelName)
      options[relationModelName] = { ref: 'id', attributes: belongsTo.schema.dataFieldsNames }

      dataSet = castModelRows.map((row) => {
        row[relationModelName] = _.find(castRelationRows, {'id': row[fkName]})
        return row
      })
    }

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
  includeBelongsToRelations,
  fetchBelongsToRelation,
  fetchHasManyRelation
}
