'use strict'
const test = require('tape')

const Schema = require('../../lib/sql-builder/schema')
const SqlBuilder = require('../../lib/sql-builder/sql-builder')

const schema = new Schema({
  name: 'string',
  hide: 'boolean',
  group: {
    belongsTo: { name: 'user-group' }
  }
})

test('sqlBuilder.columns holds only columns` descriptors', (t) => {
  const sqlBuilder = new SqlBuilder(schema)

  t.equal(Object.keys(sqlBuilder.columns).length, 2)
  t.equal(sqlBuilder.columns.name, 'string')
  t.equal(sqlBuilder.columns.hide, 'boolean')
  t.end()
})

test('sqlBuilder.columnsNames holds columns` names', (t) => {
  const sqlBuilder = new SqlBuilder(schema)

  t.equal(sqlBuilder.columnsNames.length, 2)
  t.equal(sqlBuilder.columnsNames[0], 'name')
  t.equal(sqlBuilder.columnsNames[1], 'hide')
  t.end()
})
