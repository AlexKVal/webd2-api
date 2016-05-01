const {camelCase, transform} = require('lodash')
const foreignKey = require('./foreign-key')

function getBelongsToRelations (schemaObject) {
  return transform(schemaObject, (memo, descriptor, modelFieldName) => {
    if (typeof descriptor === 'object') {
      if (descriptor.belongsTo) {
        const relationModelName = descriptor.belongsTo
        memo.push({
          relationModelName,
          modelFieldName,
          fkField: descriptor.fkField || camelCase(relationModelName),
          fkAs: descriptor.fkAs || foreignKey(relationModelName)
        })
      }
    }
  }, [])
}

function attributesOfRelations (registry, parentSchema) {
  const result = {}

  getBelongsToRelations(parentSchema).forEach((rel) => {
    const relationModel = registry.model(rel.relationModelName)
    result[rel.modelFieldName] = Object.keys(relationModel.sqlBuilder.schemaObject)
  })

  return result
}

module.exports = {
  getBelongsToRelations,
  attributesOfRelations
}
