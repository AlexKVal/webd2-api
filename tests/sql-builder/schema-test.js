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

test('Schema.dataFieldsNames contains array of dataFields names', (t) => {
  const schema = new Schema({
    name: 'string',
    hide: 'boolean',
    group: {
      belongsTo: 'user-group'
    }
  })

  t.equal(schema.dataFieldsNames.length, 2)
  t.equal(schema.dataFieldsNames[0], 'name')
  t.equal(schema.dataFieldsNames[1], 'hide')
  t.end()
})

test('Schema.relations is object which contains descriptions of relations', (t) => {
  const schema = new Schema({
    name: 'string',
    group: {
      belongsTo: 'user-group'
    },
    posts: {
      hasMany: 'post'
    }
  })

  t.equal(Object.keys(schema.relations).length, 2)
  t.equal(schema.relations.group.belongsTo, 'user-group')
  t.equal(schema.relations.posts.hasMany, 'post')
  t.end()
})
