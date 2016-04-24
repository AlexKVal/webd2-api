'use strict'
const test = require('tape')

const BaseModel = require('../../lib/models/base-model')
const Schema = require('../../lib/sql-builder/schema')
const Serializer = require('../../lib/utils/serializer')

const dbMock = { exec () { return Promise.resolve() } }

test('serializer.withoutRelated() does not include relations data', (t) => {
  class UserGroup extends BaseModel {}
  const userGroup = new UserGroup(dbMock, 'user-group', { name: 'string' })

  class Rights extends BaseModel {}
  const rights = new Rights(dbMock, 'rights', { name: 'string' })

  const serializer = new Serializer('user', new Schema({
    name: 'string',
    group: {
      belongsTo: userGroup,
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: rights,
      fkField: 'GrpID'
    }
  }))

  const serializedModel = serializer.withoutRelated([
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
  ])

  t.deepEqual(serializedModel, {
    data: [{
      attributes: { name: 'John' },
      id: '1',
      relationships: {
        group: { data: { id: '101', type: 'groups' } },
        rights: { data: { id: '12', type: 'rights' } }
      },
      type: 'users'
    }, {
      attributes: { name: 'Smith' },
      id: '2',
      relationships: {
        group: { data: { id: '102', type: 'groups' } },
        rights: { data: { id: '13', type: 'rights' } }
      },
      type: 'users'
    }]
  })

  t.end()
})

test('serializer.withRelated() includes relations data', (t) => {
  class UserGroup extends BaseModel {}
  const userGroup = new UserGroup(dbMock, 'user-group', { name: 'string' })

  class Rights extends BaseModel {}
  const rights = new Rights(dbMock, 'rights', { name: 'string' })

  const serializer = new Serializer('user', new Schema({
    name: 'string',
    group: {
      belongsTo: userGroup,
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: rights,
      fkField: 'GrpID'
    }
  }))

  const serializedModel = serializer.withRelated([
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
  ])

  t.deepEqual(serializedModel, {
    data: [{
      attributes: { name: 'John' },
      id: '1',
      relationships: {
        group: { data: { id: '101', type: 'groups' } },
        rights: { data: { id: '12', type: 'rights' } }
      },
      type: 'users'
    }, {
      attributes: { name: 'Smith' },
      id: '2',
      relationships: {
        group: { data: { id: '102', type: 'groups' } },
        rights: { data: { id: '13', type: 'rights' } }
      },
      type: 'users'
    }],
    included: [{
      attributes: { name: 'Admins' },
      id: '101',
      type: 'groups'
    }, {
      attributes: { name: 'Full' },
      id: '12',
      type: 'rights'
    }, {
      attributes: { name: 'Users' },
      id: '102',
      type: 'groups'
    }, {
      attributes: { name: 'Part' },
      id: '13',
      type: 'rights'
    }]
  })

  t.end()
})

/**
 * De-serializer
 */
test('serializer.deserializerOptions takes into account "belongsTo" relations', (t) => {
  class UserGroup extends BaseModel {}
  const userGroup = new UserGroup(dbMock, 'user-group', {})
  const serializer = new Serializer('user', new Schema({
    name: 'string',
    group: {
      belongsTo: userGroup,
      fkField: 'GrpID'
    }
  }))

  t.equal(Object.keys(serializer.deserializerOptions).length, 2)
  t.equal(serializer.deserializerOptions.keyForAttribute, 'camelCase')
  t.ok(serializer.deserializerOptions['user-groups'])
  t.ok(serializer.deserializerOptions['user-groups'].valueForRelationship)
  t.equal(typeof serializer.deserializerOptions['user-groups'].valueForRelationship, 'function')

  t.end()
})

test('serializer.deserialize() method deserializes data', (t) => {
  class UserGroup extends BaseModel {}
  const userGroup = new UserGroup(dbMock, 'user-group', {})
  class UserRights extends BaseModel {}
  const userRights = new UserRights(dbMock, 'user-rights', {})

  const serializer = new Serializer('user', new Schema({
    name: 'string',
    group: {
      belongsTo: userGroup,
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: userRights,
      fkField: 'rights'
    }
  }))

  serializer.deserialize({
    data: [ {
      attributes: {
        name: 'Admin',
        'user-group-id': '1',
        'user-rights-id': '3'
      },
      id: '1',
      type: 'users'
    } ]
  })
  .then((data) => {
    t.deepEqual(data, [ {id: '1', name: 'Admin', userGroupId: '1', userRightsId: '3'} ])
    t.end()
  })
})
