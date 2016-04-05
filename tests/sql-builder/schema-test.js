'use strict'
const test = require('tape')

const Schema = require('../../lib/sql-builder/schema')

test('Schema: allows "new Schema()" and just "Schema()"', (t) => {
  t.ok(((Schema({})) instanceof Schema))
  t.ok(((new Schema({})) instanceof Schema))
  t.end()
})

test('Schema.dataFields describes only dataFields', (t) => {
  const schema = new Schema({
    name: 'string',
    hide: 'boolean',
    group: {
      belongsTo: 'user-group'
    }
  })

  t.equal(Object.keys(schema.dataFields).length, 2)
  t.equal(schema.dataFields.name, 'string')
  t.equal(schema.dataFields.hide, 'boolean')
  t.end()
})
