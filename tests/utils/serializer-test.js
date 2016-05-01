'use strict'
const test = require('tape')

const BaseModel = require('../../lib/models/base-model')
const Serializer = require('../../lib/utils/serializer')

const dbMock = { exec () { return Promise.resolve() } }

test('Serializer.constructor', (t) => {
  t.throws(
    () => new Serializer({}),
    /provide `modelName`/,
    'requires `modelName`'
  )

  t.throws(
    () => new Serializer({modelName: 'some'}),
    /provide `attributes`/,
    'requires `attributes`'
  )

  t.throws(
    () => new Serializer({modelName: 'some', attributes: []}),
    /provide `attributesOfRelations`/,
    'requires `attributesOfRelations`'
  )

  const fn1 = function () {
    new Serializer({ // eslint-disable-line
      modelName: 'userAccount',
      attributes: ['name', 'userGroup'],
      attributesOfRelations: {
        rel1: ['one', 'two'],
        rel2: ['one1', 'two1']
      },
      belongsToRelations: []
    })
  }

  t.doesNotThrow(fn1, 'when all parameters are provided')

  t.end()
})

const serializerOptions = Serializer.serializerOptions

test('Serializer.serializerOptions()', (t) => {
  const modelAttributes = ['name', 'hide', 'rel1', 'rel2']

  const attributesOfRelations = {
    rel1: ['enabled'],
    rel2: ['shortName']
  }

  let relatedIncluded = true
  const options1 = serializerOptions(modelAttributes, attributesOfRelations, relatedIncluded)
  t.deepEqual(
    options1,
    {
      attributes: ['name', 'hide', 'rel1', 'rel2'],
      keyForAttribute: 'camelCase',
      rel1: { attributes: ['enabled'], included: true, ref: 'id' },
      rel2: { attributes: ['shortName'], included: true, ref: 'id' }
    },
    'generates options with `included` on'
  )

  relatedIncluded = false
  const options2 = serializerOptions(modelAttributes, attributesOfRelations, relatedIncluded)
  t.deepEqual(
    options2,
    {
      attributes: ['name', 'hide', 'rel1', 'rel2'],
      keyForAttribute: 'camelCase',
      rel1: { attributes: ['enabled'], included: false, ref: 'id' },
      rel2: { attributes: ['shortName'], included: false, ref: 'id' }
    },
    'generates options with `included` off'
  )

  t.end()
})

test('serializer.withoutRelated() does not include relations data', (t) => {
  class UserGroup extends BaseModel {}
  const userGroup = new UserGroup({db: dbMock, name: 'user-group', schema: { name: 'string' }})

  class Rights extends BaseModel {}
  const rights = new Rights({db: dbMock, name: 'rights', schema: { name: 'string' }})

  const serializer = new Serializer('user', {
    name: 'string',
    group: {
      belongsTo: userGroup,
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: rights,
      fkField: 'GrpID'
    }
  })

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
  const userGroup = new UserGroup({db: dbMock, name: 'user-group', schema: { name: 'string' }})

  class Rights extends BaseModel {}
  const rights = new Rights({db: dbMock, name: 'rights', schema: { name: 'string' }})

  const serializer = new Serializer('user', {
    name: 'string',
    group: {
      belongsTo: userGroup,
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: rights,
      fkField: 'GrpID'
    }
  })

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
  const userGroup = new UserGroup({db: dbMock, name: 'user-group', schema: {}})
  const serializer = new Serializer('user', {
    name: 'string',
    group: {
      belongsTo: userGroup,
      fkField: 'GrpID'
    }
  })

  t.equal(Object.keys(serializer.deserializerOptions).length, 2)
  t.equal(serializer.deserializerOptions.keyForAttribute, 'camelCase')
  t.ok(serializer.deserializerOptions['user-groups'])
  t.ok(serializer.deserializerOptions['user-groups'].valueForRelationship)
  t.equal(typeof serializer.deserializerOptions['user-groups'].valueForRelationship, 'function')

  t.end()
})

test('serializer.deserialize() method deserializes data', (t) => {
  class UserGroup extends BaseModel {}
  const userGroup = new UserGroup({db: dbMock, name: 'user-group', schema: {}})
  class UserRights extends BaseModel {}
  const userRights = new UserRights({db: dbMock, name: 'user-rights', schema: {}})

  const serializer = new Serializer('user', {
    name: 'string',
    group: {
      belongsTo: userGroup,
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: userRights,
      fkField: 'rights'
    }
  })

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
