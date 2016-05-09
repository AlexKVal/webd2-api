'use strict'

const { isUndefined } = require('lodash')

/**
 * parses and converts req.query to options for db-layer
 * filter => where
 * order => orderBy
 * related => withRelated
 * fields => fieldsOnly
 */
function parseQueryParams (query) {
  const {related, fields, filter, order} = query

  const parsedOptions = {
    withRelated: !!related
  }

  if (!isUndefined(fields)) parsedOptions.fieldsOnly = fields
  if (!isUndefined(filter)) parsedOptions.where = filter
  if (!isUndefined(order)) parsedOptions.orderBy = order

  return parsedOptions
}

module.exports = parseQueryParams
