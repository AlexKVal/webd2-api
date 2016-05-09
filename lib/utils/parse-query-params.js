'use strict'

const {
  every, castArray, isObjectLike, isString,
  isUndefined, mapValues, values, trim
} = require('lodash')

function isAlphanumeric (string) {
  return /^[0-9A-Z]+$/i.test(string)
}

/**
 * parses and validates values of req.query to options for db-layer
 * filter => where
 * order => orderBy
 * related => withRelated
 * fields => fieldsOnly
 *
 * fieldsOnly is validated in sqlBuilder by intersection(this.columnsNames, fieldsOnly)
 */
function parseQueryParams (query) {
  const {related, fields, filter, order} = query

  const parsedOptions = {}

  if (!isUndefined(related)) {
    if (related === 'true') parsedOptions.withRelated = true
    if (related === 'false') parsedOptions.withRelated = false
  }

  if (!isUndefined(fields)) {
    if (fields === 'id') {
      parsedOptions.fieldsOnly = 'id'
    } else {
      if (fields && fields.length > 0) {
        const resArray = castArray(fields)

        const isOk = every(resArray, (fieldName) => isString(fieldName) && isAlphanumeric(fieldName))

        if (isOk) parsedOptions.fieldsOnly = resArray
      }
    }
  }

  if (!isUndefined(filter)) {
    if (isObjectLike(filter) && Object.keys(filter).length > 0) {
      const fieldNames = Object.keys(filter)

      const isFieldNamesOk = every(fieldNames, (fieldName) => isString(fieldName) && isAlphanumeric(fieldName))
      const isValuesOK = every(values(filter), (val) => isString(val))

      if (isFieldNamesOk && isValuesOK) {
        parsedOptions.where = mapValues(filter, (val) => {
          if (val === 'true') return true
          if (val === 'false') return false
          return val
        })
      }
    }
  }

  if (!isUndefined(order)) {
    if (order && order.length > 0) {
      const resArray = castArray(order)

      const isOk = every(resArray, (value) => {
        if (!isString(value) || trim(value).length === 0) return false

        // only 'name' || 'name DESC' || 'name ASC' allowed
        const split = value.toLowerCase().split(' ')

        if (!isAlphanumeric(split.join(''))) return false

        if (split.length > 2) return false

        if (split.length > 1 && split[1] !== 'desc' && split[1] !== 'asc') return false

        return true
      })

      if (isOk) parsedOptions.orderBy = resArray
    }
  }

  return parsedOptions
}

module.exports = parseQueryParams
