const JSONAPISerializer = require('jsonapi-serializer').Serializer

module.exports = function getSerializer (modelName, attributes) {
  return function serialize (rows) {
    return new JSONAPISerializer(modelName, rows, {
      attributes
    })
  }
}
