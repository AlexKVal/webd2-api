const { transform } = require('lodash')
const DescBelongsTo = require('./desc-belongsto')

function getBelongsToDescriptors (schemaObject) {
  return transform(schemaObject, (memo, descriptor, modelFieldName) => {
    if (typeof descriptor === 'object' && descriptor.belongsTo) {
      memo.push(new DescBelongsTo(modelFieldName, descriptor))
    }
  }, [])
}

function attributesOfRelations (registry, belongsToRelations) {
  const result = {}

  belongsToRelations.forEach((rel) => {
    const relationModel = registry.model(rel.relationModelName)
    result[rel.modelFieldName] = relationModel.attributesSerialize
  })

  return result
}

module.exports = {
  getBelongsToDescriptors,
  attributesOfRelations
}
