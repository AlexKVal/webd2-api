'use strict'
const test = require('tape')

const Schema = require('../../lib/sql-builder/schema')

test('Schema: allows "new Schema()" and just "Schema()"', (t) => {
  t.ok(((Schema({})) instanceof Schema))
  t.ok(((new Schema({})) instanceof Schema))
  t.end()
})

test('Schema: "attributes" contains all dataSet keys', (t) => {
  const schema = new Schema({
    name: 'string',
    boolFlag: 'boolean',
    someNumber: 'integer',

    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' },
      fkField: 'rights',
      fkAs: 'whatever'
    }
  })

  t.equal(schema.attributes.length, 7)
  t.deepEqual(schema.attributes, [
    'name', 'boolFlag',
    'someNumber', 'userGroupId',
    'group', 'whatever', 'rights'
  ])
  t.end()
})

test('schema.getBelongsToRelations() returns array of "belongsTo" relations', (t) => {
  const userGroupModel = { name: 'user-group' }
  const rightsModel = { name: 'rights' }

  const schema = new Schema({
    group: {
      belongsTo: userGroupModel,
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: rightsModel,
      fkField: 'rights'
    }
  })

  const relations = schema.getBelongsToRelations()
  t.equal(relations.length, 2)
  t.deepEqual(relations, [
    {
      name: 'group',
      relationModel: userGroupModel,
      fkField: 'GrpID',
      fkName: 'userGroupId'
    },
    {
      name: 'rights',
      relationModel: rightsModel,
      fkField: 'rights',
      fkName: 'rightsId'
    }
  ])
  t.end()
})
