'use strict'
const test = require('tape')

const {castTypes, castTypesRows, castTypesRow} = require('../../lib/utils/cast-types')
const Schema = require('../../lib/sql-builder/schema')

test('all ids are string type', (t) => {
  const odbcRow = {
    id: '45'
  }
  const schema = new Schema({})

  const row = castTypesRow(odbcRow, schema)

  t.equal(row.id, '45')
  t.end()
})

test('unknown type returned as is', (t) => {
  const odbcRow = {
    any: 455,
    other: true,
    third: 'str'
  }
  const schema = new Schema({})

  const row = castTypesRow(odbcRow, schema)

  t.equal(row.any, 455)
  t.equal(row.other, true)
  t.equal(row.third, 'str')
  t.end()
})

test('"string" type', (t) => {
  const odbcRow = {
    any: 455,
    other: true,
    third: 'str'
  }
  const schema = new Schema({
    any: 'string',
    other: 'string',
    third: 'string'
  })

  const row = castTypesRow(odbcRow, schema)

  t.equal(row.any, '455')
  t.equal(row.other, 'true')
  t.equal(row.third, 'str')
  t.end()
})

test('null and undefined are returned as empty string', (t) => {
  const odbcRow = {
    any: null,
    other: undefined,
    third: 'str'
  }
  const schema = new Schema({
    any: 'string',
    other: 'string',
    third: 'string'
  })

  const row = castTypesRow(odbcRow, schema)

  t.equal(row.any, '')
  t.equal(row.other, '')
  t.equal(row.third, 'str')
  t.end()
})

test('casting of boolean values with schema.string done right', (t) => {
  const odbcRow = {
    falseString: false,
    trueString: true
  }
  const schema = new Schema({
    falseString: 'string',
    trueString: 'string'
  })

  const row = castTypesRow(odbcRow, schema)

  t.equal(row.falseString, 'false')
  t.equal(row.trueString, 'true')
  t.end()
})

test('"boolean" type', (t) => {
  const odbcRow = {
    enabled: '0',
    hidden: '1'
  }
  const schema = new Schema({
    enabled: 'boolean',
    hidden: 'boolean'
  })

  const row = castTypesRow(odbcRow, schema)

  t.equal(row.enabled, false)
  t.equal(row.hidden, true)
  t.end()
})

test('"integer" type', (t) => {
  const odbcRow = {
    some: '25',
    other: '100'
  }
  const schema = new Schema({
    some: 'integer',
    other: 'integer'
  })

  const row = castTypesRow(odbcRow, schema)

  t.equal(row.some, 25)
  t.equal(row.other, 100)
  t.end()
})

const schema = new Schema({
  name: 'string',
  password: 'string',
  rights: 'id',
  hide: 'boolean',
  enabled: 'boolean'
})

test('castRow', (t) => {
  const odbcRow = {
    id: '45',
    name: 'admin',
    rights: '3',
    hide: '0',
    enabled: '1'
  }

  const row = castTypesRow(odbcRow, schema)

  t.equal(row.id, '45', 'id has "id" type')
  t.equal(row.name, 'admin', 'name: string type')
  t.equal(row.rights, '3', 'rights: id type')
  t.equal(row.hide, false, 'hide: boolean type')
  t.equal(row.enabled, true, 'enabled: boolean type')
  t.end()
})

test('castRows', (t) => {
  const odbcRows = [
    {
      id: '45',
      name: 'admin',
      rights: '3',
      hide: '0',
      enabled: '1'
    },
    {
      id: '46',
      name: 'user',
      rights: '2',
      hide: '1',
      enabled: '0'
    }
  ]

  const rows = castTypesRows(odbcRows, schema)

  t.equal(rows.length, 2)

  t.equal(rows[0].id, '45', 'id has "id" type')
  t.equal(rows[0].name, 'admin', 'name: string type')
  t.equal(rows[0].rights, '3', 'rights: id type')
  t.equal(rows[0].hide, false, 'hide: boolean type')
  t.equal(rows[0].enabled, true, 'enabled: boolean type')

  t.equal(rows[1].id, '46', 'id has "id" type')
  t.equal(rows[1].name, 'user', 'name: string type')
  t.equal(rows[1].rights, '2', 'rights: id type')
  t.equal(rows[1].hide, true, 'hide: boolean type')
  t.equal(rows[1].enabled, false, 'enabled: boolean type')

  t.end()
})

test('castTypes handles "row"', (t) => {
  const odbcRow = {
    id: '45'
  }

  const row = castTypes(odbcRow, schema)

  t.equal(row.id, '45', 'id has "id" type')
  t.end()
})

test('castTypes handles "rows"', (t) => {
  const odbcRows = [
    { id: '45' },
    { id: '46' }
  ]

  const rows = castTypes(odbcRows, schema)

  t.equal(rows.length, 2)

  t.end()
})
