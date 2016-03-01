const JSONAPISerializer = require('jsonapi-serializer')

module.exports = function getSerializer (modelName, attributes) {
  return function userSerialize (rows) {
    return new JSONAPISerializer(modelName, rows, {
      attributes,
      keyForAttribute: 'camelCase'
    })
  }
}
