const {camelCase, transform} = require('lodash')
const foreignKey = require('./foreign-key')

function getBelongsToRelations (schemaObject) {
  return transform(schemaObject, (memo, descriptor, modelFieldName) => {
    if (typeof descriptor === 'object') {
      if (descriptor.belongsTo) {
        const relation = descriptor.belongsTo
        const fkField = descriptor.fkField || camelCase(relation.name)
        const fkAs = descriptor.fkAs || foreignKey(relation.name)
        memo.push({
          relationModel: relation,
          modelFieldName,
          fkField,
          fkAs
        })
      }
    }
  }, [])
}

module.exports = {
  getBelongsToRelations
}
