'use strict'
const camelCase = require('lodash').camelCase

/**
 * jsonapi-serializer@3.0.0 doesn't obey "keyForAttribute: 'camelCase'"
 * (mutates 'data' argument)
 */
module.exports = function camelCaseKeys (data) {
  Object.keys(data).forEach((key) => {
    if (/-/.test(key)) { // e.g. 'user-group'
      data[camelCase(key)] = data[key]
      delete data[key]
    }
  })
  return data
}
