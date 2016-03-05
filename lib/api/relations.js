'use strict'

const _ = require('lodash')
const JSONAPISerializer = require('jsonapi-serializer').Serializer

function fetchBelongsToRelation ({model, belongsTo}) {
  const relationName = belongsTo.name
  const fkName = _.camelCase(relationName) + 'Id'

  return Promise.all([ model.all(), belongsTo.all() ])
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

module.exports = {
  fetchBelongsToRelation
}
