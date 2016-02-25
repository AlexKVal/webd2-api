import JSONAPISerializer from 'jsonapi-serializer'

export default function getSerializer (modelName, attributes) {
  return function userSerialize (rows) {
    return new JSONAPISerializer(modelName, rows, {
      attributes,
      keyForAttribute: 'CamelCase'
    })
  }
}
