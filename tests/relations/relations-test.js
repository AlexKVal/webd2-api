'use strict'
const test = require('tape')

const DescBelongsTo = require('../../lib/sql-builder/desc-belongsto')

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

test('relations._embedHasMany()', (t) => {
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
    userRelations._embedHasMany(parentRows, relationsData),
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

test('relations._embedBelongsTo() with no relationsData provided', (t) => {
  const model = {
    name: 'user',
    schema: {
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  }

  const parentRows = [
    {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
    {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
  ]

  const userRelations = new Relations(model.name, model.schema)

  // mock
  userRelations.belongsToDescriptors = [
    new DescBelongsTo('group', model.schema.group),
    new DescBelongsTo('rights', model.schema.rights)
  ]

  t.deepEqual(
    userRelations._embedBelongsTo(parentRows /* no relationsData */),
    [
      {
        id: '1', name: 'John',
        group: { id: '101' },
        rights: {id: '12'}
      },
      {
        id: '2', name: 'Smith',
        group: {id: '102'},
        rights: {id: '13'}
      }
    ],
    'just embeds empty belongsTo relations instead of beongsTo-fkAs`'
  )

  t.end()
})

test('relations._embedBelongsTo() with relations data provided', (t) => {
  const model = {
    name: 'user',
    schema: {
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  }

  const parentRows = [
    {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
    {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
  ]

  const relationsData = [
    {
      modelFieldName: 'group',
      fkAs: 'userGroupId',
      rows: [
        {id: '101', name: 'Admins'},
        {id: '102', name: 'Users'}
      ]
    },
    {
      modelFieldName: 'rights',
      fkAs: 'rightsId',
      rows: [
        {id: '12', name: 'Full'},
        {id: '13', name: 'Part'}
      ]
    }
  ]

  const userRelations = new Relations(model.name, model.schema)

  t.deepEqual(
    userRelations._embedBelongsTo(parentRows, relationsData),
    [
      {
        id: '1', name: 'John',
        group: { id: '101', name: 'Admins' },
        rights: {id: '12', name: 'Full'}
      },
      {
        id: '2', name: 'Smith',
        group: {id: '102', name: 'Users'},
        rights: {id: '13', name: 'Part'}
      }
    ],
    'embeds relations data'
  )

  t.end()
})
