const { transform } = require('lodash')
const DescBelongsTo = require('./desc-belongsto')
const DescHasMany = require('./desc-hasmany')

function getBelongsToDescriptors (schemaObject) {
  if (schemaObject == null) throw new TypeError('getBelongsToDescriptors: schemaObject is undefined')
  return transform(schemaObject, (memo, descriptor, modelFieldName) => {
    if (typeof descriptor === 'object' && descriptor.belongsTo) {
      memo.push(new DescBelongsTo(modelFieldName, descriptor))
    }
  }, [])
}

function getHasManyDescriptors (schemaObject) {
  if (schemaObject == null) throw new TypeError('getHasManyDescriptors: schemaObject is undefined')
  return transform(schemaObject, (memo, descriptor, modelFieldName) => {
    if (typeof descriptor === 'object' && descriptor.hasMany) {
      memo.push(new DescHasMany(modelFieldName, descriptor))
    }
  }, [])
}

function attributesOfRelations (registry, belongsToDescriptors, hasManyDescriptors) {
  const result = {}

  if (belongsToDescriptors) {
    belongsToDescriptors.forEach((rel) => {
      const relationModel = registry.model(rel.relationModelName)
      result[rel.modelFieldName] = relationModel.attributesSerialize
    })
  }

  if (hasManyDescriptors) {
    hasManyDescriptors.forEach((rel) => {
      const relationModel = registry.model(rel.relationModelName)
      result[rel.modelFieldName] = relationModel.attributesSerialize
    })
  }

  return result
}

module.exports = {
  getBelongsToDescriptors,
  getHasManyDescriptors,
  attributesOfRelations
}
