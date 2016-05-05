'use strict'
const test = require('tape')

const Relations = require('../../lib/relations/relations')

test('Relations', (t) => {
  t.throws(
    () => new Relations(/* no modelName */),
    /modelName is undefined/
  )

  t.throws(
    () => new Relations('user' /* no modelSchema */),
    /modelSchema is undefined/
  )

  t.throws(
    () => new Relations('user', 'modelSchema is not an object'),
    /modelSchema should be an object/
  )

  const model = {
    name: 'userGroup',
    schema: {
      name: 'string',
      hide: 'boolean',
      users: {
        hasMany: 'user',
        fkField: 'GrpID'
      }
    }
  }

  const userRelations = new Relations(model.name, model.schema)

  t.equal(userRelations.modelName, 'userGroup')
  t.equal(userRelations.modelSchema, model.schema)
  // TODO t.equal(userRelations.attributesToSerialize, [''])

  t.end()
})

test('relations._joinHasMany()', (t) => {
  const model = {
    name: 'userGroup',
    schema: {
      name: 'string',
      hide: 'boolean',
      users: {
        hasMany: 'user',
        fkField: 'GrpID'
      }
    }
  }

  const relationsData = [
    {
      modelFieldName: 'users',
      parentModelFieldName: 'group',
      rows: [
        { id: '101', name: 'John', cardcode: '123', hide: false, userGroupId: '1' },
        { id: '102', name: 'Simona', cardcode: '455', hide: false, userGroupId: '1' },
        { id: '103', name: 'Whatson', cardcode: '', hide: false, userGroupId: '2' },
        { id: '104', name: 'Vaschev', cardcode: '9022', hide: false, userGroupId: '2' }
      ]
    }
  ]

  const parentRows = [
    {id: '1', name: 'Bartenders', hide: false},
    {id: '2', name: 'Waiters', hide: false}
  ]

  const userRelations = new Relations(model.name, model.schema)

  t.deepEqual(
    userRelations._joinHasMany(parentRows, relationsData),
    [
      {
        id: '1', name: 'Bartenders', hide: false,
        users: [
          { id: '101', name: 'John', cardcode: '123', hide: false, group: {id: '1'} },
          { id: '102', name: 'Simona', cardcode: '455', hide: false, group: {id: '1'} }
        ]
      },
      {
        id: '2', name: 'Waiters', hide: false,
        users: [
          { id: '103', name: 'Whatson', cardcode: '', hide: false, group: {id: '2'} },
          { id: '104', name: 'Vaschev', cardcode: '9022', hide: false, group: {id: '2'} }
        ]
      }
    ],
    'joins in hasMany relations data'
  )

  t.end()
})
