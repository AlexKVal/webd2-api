'use strict'
const test = require('tape')

const Schema = require('../../lib/sql-builder/schema')

/**
 * mocks for 'belongsTo' relation models
 */
const userGroupModel = { name: 'user-group' }
const postModel = { name: 'post' }
const rightsModel = { name: 'rights' }
const registry = {
  'user-group': userGroupModel,
  post: postModel,
  rights: rightsModel
}

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
      belongsTo: registry['user-group']
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
      belongsTo: registry['user-group']
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
      belongsTo: registry['user-group']
    },
    posts: {
      hasMany: registry['post']
    }
  })

  t.equal(Object.keys(schema.relations).length, 2)
  t.equal(schema.relations.group.belongsTo.name, 'user-group')
  t.equal(schema.relations.posts.hasMany.name, 'post')
  t.end()
})

test('Schema: belongsTo autogenerates "fkAs" if undefined', (t) => {
  const schema = new Schema({
    group: {
      belongsTo: registry['user-group'],
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: registry['rights'],
      fkField: 'rights',
      fkAs: 'whatever'
    }
  })

  t.equal(schema.relations.group.fkAs, 'userGroupId', 'autogenerated')
  t.equal(schema.relations.rights.fkAs, 'whatever', 'user-defined')
  t.end()
})

test('Schema: "attributes" is array of all "data" + "belongsTo.fkAs" fields', (t) => {
  const schema = new Schema({
    name: 'string',
    boolFlag: 'boolean',
    someNumber: 'integer',

    group: {
      belongsTo: registry['user-group'],
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: registry['rights'],
      fkField: 'rights',
      fkAs: 'whatever'
    }
  })

  t.equal(schema.attributes.length, 5)
  t.deepEqual(schema.attributes, ['name', 'boolFlag', 'someNumber', 'userGroupId', 'whatever'])
  t.end()
})
