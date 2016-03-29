'use strict'

function getCaster (schema) {
  if (schema == null) throw new Error('getCaster() you should provide "schema"')

  return function caster (key, val) {
    const type = (key === 'id') ? 'id' : schema[key]

    switch (type) {
      case 'id':
        return parseInt(val, 10)
      case 'string':
        return String(val)
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

module.exports = {
  castTypesRow,
  castTypesRows
}
