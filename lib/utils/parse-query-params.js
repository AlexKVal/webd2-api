'use strict'

const { castArray, isUndefined } = require('lodash')

/**
 * parses and converts req.query to options for db-layer
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

  if (!isUndefined(related)) parsedOptions.withRelated = !!related

  if (!isUndefined(fields)) {
    if (fields !== 'id') {
      const arr = castArray(fields)
      if (arr.length > 0) parsedOptions.fieldsOnly = castArray(fields)
    } else {
      parsedOptions.fieldsOnly = fields
    }
  }

  if (!isUndefined(filter)) parsedOptions.where = filter
  if (!isUndefined(order)) parsedOptions.orderBy = order

  return parsedOptions
}

module.exports = parseQueryParams
