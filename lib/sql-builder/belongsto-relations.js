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

module.exports = {
  getBelongsToRelations
}
