'use strict'

/**
 * parses and converts req.query to options for db-layer
 * filter => where
 * order => orderBy
 * related => withRelated
 * fields => fieldsOnly
 */
function parseQueryParams (query) {
  return {
    withRelated: query.related,

    fieldsOnly: query.fields,
    where: query.filter,
    orderBy: query.order
  }
}

module.exports = parseQueryParams
