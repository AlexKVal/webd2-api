'use strict'
const _ = require('lodash')

function getCaster (schema) {
  if (schema == null) {
    throw new Error('getCaster() you should provide "schema"')
  }
  if (!(schema instanceof Object)) {
    throw new Error('getCaster() schema should be an object')
  }

  return function caster (key, val) {
    const type = schema.descriptors[key]

    switch (type) {
      case 'id':
      case 'string':
        return String(val != null ? val : '')
      case 'integer':
        return parseInt(val, 10)
      case 'boolean':
        return val === '1'
      default:
        return val
    }
  }
}

function castTypesRow (row, schema) {
  const caster = getCaster(schema)

  return Object.keys(row).reduce((acc, key) => {
    acc[key] = caster(key, row[key])
    return acc
  }, {})
}

function castTypesRows (rows, schema) {
  const caster = getCaster(schema)

  return rows.map((row) => Object.keys(row).reduce((acc, key) => {
    acc[key] = caster(key, row[key])
    return acc
  }, {}))
}

function castTypes (rows, schema) {
  return _.isArray(rows)
    ? castTypesRows(rows, schema)
    : castTypesRow(rows, schema)
}

module.exports = {
  castTypes,
  castTypesRow,
  castTypesRows
}
