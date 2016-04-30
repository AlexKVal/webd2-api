const {transform} = require('lodash')
const foreignKey = require('./foreign-key')

function getBelongsToRelations (schemaObject) {
  return transform(schemaObject, (memo, descriptor, fieldName) => {
    if (typeof descriptor === 'object') { // relations
      if (descriptor.belongsTo) {
        const relationModel = descriptor.belongsTo

        memo.push({
          name: fieldName,
          relationModel: relationModel,
          fkField: descriptor.fkField,
          fkName: descriptor.fkAs || foreignKey(relationModel.name)
        })
      }
    }
  }, [])
}

module.exports = {
  getBelongsToRelations
}
