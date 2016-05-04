'use strict'
const test = require('tape')

const ApiWrapper = require('../../lib/api/api-wrapper')

const registryMock = { model (modelName) { return {name: modelName} } }

test('ApiWrapper', (t) => {
  const someModelMock = { name: 'some-model-name' }
  const apiWrappedSomeModel = new ApiWrapper({
    model: someModelMock,
    serializer: {}, deserializer: {},
    registryMock
  })

  t.throws(
    () => new ApiWrapper(),
    /Cannot match against 'undefined' or 'null'/,
    'needs at least a {model: model}'
  )

  t.throws(
    () => new ApiWrapper({ model: {} }),
    /ApiWrapper needs a model/,
    'model should be with a name'
  )

  const aModelMock = { name: 'modelName', attributesSerialize: [] }
  t.doesNotThrow(
    () => new ApiWrapper(aModelMock),
    /ApiWrapper needs a model/,
    'model could be provided directly'
  )

  const aRegistryMock = {}
  t.doesNotThrow(
    () => new ApiWrapper(aModelMock, aRegistryMock),
    'registry could be passed as a second argument for testing'
  )

  t.equal(apiWrappedSomeModel.model, someModelMock, '`model` property holds a model')

  t.end()
})

test('apiWrapper.apiCreate()', (t) => {
  t.plan(5)

  const newDataFromClient = { some: 'does not matter' }
  const deserializedNewData = { someOther: 'also does not matter' }
  const dataFromCreate = { some2: '2' }

  const deserializer = {
    deserialize (newData) {
      t.equal(newData, newDataFromClient, 'passes to deserializer newData')
      return Promise.resolve(deserializedNewData)
    }
  }

  const model = {
    name: 'someModelName',

    create (deserialized) {
      t.equal(
        deserialized,
        deserializedNewData,
        'provides deserialized data to model`s create() method'
      )

      return Promise.resolve(dataFromCreate)
    }
  }

  const apiWrappedModel = new ApiWrapper({model, deserializer, serializer: {}, registryMock})

  t.throws(
    () => apiWrappedModel.apiCreate(/* no data */),
    /newData cannot be undefined/,
    'needs a newData'
  )

  // mock it for testing
  apiWrappedModel._joinRelationsAndSerialize = (record) => {
    t.equal(
      record,
      dataFromCreate,
      'joins relations and serializes the result from model.create()'
    )

    return 'joined and serialized record'
  }

  apiWrappedModel.apiCreate(newDataFromClient)
  .then((result) => t.equal(result, 'joined and serialized record'))
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('apiWrapper.apiCreate() returns error from deserializer', (t) => {
  t.plan(2)

  const deserializer = {
    deserialize (newData) {
      t.equal(newData, 'new data from client', 'passes to deserializer newData')
      return Promise.reject(new Error('some deserializer`s error'))
    }
  }

  const model = {
    name: 'someModelName',
    create (deserialized) {
      t.fail('model.create() should not be called')
    }
  }

  const apiWrappedModel = new ApiWrapper({model, deserializer, serializer: {}, registryMock})

  // mock it for testing
  apiWrappedModel._joinRelationsAndSerialize = () => {
    t.fail('_joinRelationsAndSerialize() should not be called')
  }

  apiWrappedModel.apiCreate('new data from client')
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.equal(
      e.message,
      'some deserializer`s error',
      'returns error from deserializer'
    )
  })
  .then(() => t.end())
})

test('apiWrapper.apiCreate() returns error from model.create()', (t) => {
  t.plan(3)

  const deserializer = {
    deserialize (newData) {
      t.equal(newData, 'new data from client', 'passes to deserializer newData')
      return Promise.resolve('deserializedNewData')
    }
  }

  const model = {
    name: 'someModelName',

    create (deserialized) {
      t.equal(
        deserialized,
        'deserializedNewData',
        'provides deserialized data to model`s create() method'
      )

      return Promise.reject(new Error('some create()`s error'))
    }
  }

  const apiWrappedModel = new ApiWrapper({model, deserializer, serializer: {}, registryMock})

  // mock it for testing
  apiWrappedModel._joinRelationsAndSerialize = () => {
    t.fail('_joinRelationsAndSerialize() should not be called')
  }

  apiWrappedModel.apiCreate('new data from client')
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.equal(
      e.message,
      'some create()`s error',
      'returns error from model.create()'
    )
  })
  .then(() => t.end())
})

test('apiWrapper.apiUpdate()', (t) => {
  t.plan(6)

  const updatesDataFromClient = { some: 'does not matter' }
  const deserializedUpdatesData = { someOther: 'also does not matter' }
  const dataFromUpdate = { some2: '2' }

  const deserializer = {
    deserialize (data) {
      t.equal(data, updatesDataFromClient, 'passes to deserializer updates data')
      return Promise.resolve(deserializedUpdatesData)
    }
  }

  const model = {
    name: 'someModelName',

    update (id, deserialized) {
      t.equal(id, 131, 'provides id to model`s update method')
      t.equal(
        deserialized,
        deserializedUpdatesData,
        'provides deserialized data to model`s update() method'
      )

      return Promise.resolve(dataFromUpdate)
    }
  }

  const apiWrappedModel = new ApiWrapper({model, deserializer, serializer: {}, registryMock})

  t.throws(
    () => apiWrappedModel.apiUpdate(/* no id */),
    /id and updates cannot be undefined/,
    'needs id and updates'
  )

  // mock it for testing
  apiWrappedModel._joinRelationsAndSerialize = (record) => {
    t.equal(
      record,
      dataFromUpdate,
      'joins relations and serializes the result from model.update()'
    )

    return 'joined and serialized record'
  }

  apiWrappedModel.apiUpdate(131, updatesDataFromClient)
  .then((result) => t.equal(result, 'joined and serialized record'))
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('apiWrapper.apiUpdate() returns error from deserializer', (t) => {
  t.plan(1)

  const deserializer = {
    deserialize () {
      return Promise.reject(new Error('some deserializer`s error'))
    }
  }

  const model = {
    name: 'someModelName',
    update () {
      t.fail('model.update() should not be called')
    }
  }

  const apiWrappedModel = new ApiWrapper({model, deserializer, serializer: {}, registryMock})

  // mock it for testing
  apiWrappedModel._joinRelationsAndSerialize = () => {
    t.fail('_joinRelationsAndSerialize() should not be called')
  }

  apiWrappedModel.apiUpdate(131, {updatesData: 'from client'})
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.equal(
      e.message,
      'some deserializer`s error',
      'returns error from deserializer'
    )
  })
  .then(() => t.end())
})

test('apiWrapper.apiUpdate() returns error from model.update()', (t) => {
  t.plan(1)

  const deserializer = {
    deserialize () {
      return Promise.resolve('deserializedNewData')
    }
  }

  const model = {
    name: 'someModelName',
    update () {
      return Promise.reject(new Error('some update()`s error'))
    }
  }

  const apiWrappedModel = new ApiWrapper({model, deserializer, serializer: {}, registryMock})

  // mock it for testing
  apiWrappedModel._joinRelationsAndSerialize = () => {
    t.fail('_joinRelationsAndSerialize() should not be called')
  }

  apiWrappedModel.apiUpdate(131, {updatesData: 'from client'})
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.equal(
      e.message,
      'some update()`s error',
      'returns error from model.update()'
    )
  })
  .then(() => t.end())
})

test('apiWrapper.apiFind()', (t) => {
  t.plan(4)

  const dataFromSelect = { some: 'some' }

  const model = {
    name: 'someModelName',

    selectOne ({id}) {
      t.equal(id, 1001, 'provides id to model`s selectOne() method')
      return Promise.resolve(dataFromSelect)
    }
  }

  const apiWrappedModel = new ApiWrapper({ model, deserializer: {}, serializer: {}, registryMock })

  t.throws(
    () => apiWrappedModel.apiFind(/* no id */),
    /id cannot be undefined/,
    'needs an id'
  )

  // mock it for testing
  apiWrappedModel._joinRelationsAndSerialize = (record) => {
    t.equal(
      record,
      dataFromSelect,
      'joins relations and serializes the result from model.selectOne()'
    )

    return 'joined and serialized record'
  }

  apiWrappedModel.apiFind(1001)
  .then((result) => t.equal(result, 'joined and serialized record'))
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('apiWrapper.apiFetchAll() without related', (t) => {
  t.plan(4)

  const serializer = {
    withoutRelated (data) {
      t.equal(data, '"joined" data', 'passes to serializer data after joining')
      return Promise.resolve('serialized data')
    },
    withRelated () {
      t.fail('serializer.withRelated() should no be called')
    }
  }

  const model = {
    name: 'someModelName',

    selectMany (options) {
      t.deepEqual(options, {}, 'options for model.selectMany()')
      return Promise.resolve('data from selectMany')
    }
  }

  const apiWrappedModel = new ApiWrapper({model, serializer, deserializer: {}, registryMock})

  // mock it for testing
  apiWrappedModel._joinBelongsToRelations = (parentRows) => {
    t.equal(
      parentRows,
      'data from selectMany',
      'joins relations and serializes the result from model.update()'
    )

    return '"joined" data'
  }
  apiWrappedModel._fetchRelations = () => t.fail('this._fetchRelations() should not be called')

  apiWrappedModel.apiFetchAll(/* no options */)
  .then((result) => t.equal(result, 'serialized data'))
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('apiWrapper.apiFetchAll() with related', (t) => {
  t.plan(4)

  const serializer = {
    withRelated (data) {
      t.equal(data, '"joined" data', 'passes to serializer data after joining')
      return Promise.resolve('serialized data')
    },
    withoutRelated () {
      t.fail('serializer.withoutRelated() should no be called')
    }
  }

  const model = {
    name: 'someModelName',

    selectMany (options) {
      t.deepEqual(options, {withRelated: true}, 'options for model.selectMany()')
      return Promise.resolve('data from selectMany')
    }
  }

  const apiWrappedModel = new ApiWrapper({model, serializer, deserializer: {}, registryMock})

  // mock it for testing
  apiWrappedModel._fetchRelations = (parentRows) => {
    t.equal(
      parentRows,
      'data from selectMany',
      'joins relations and serializes the result from model.update()'
    )

    return '"joined" data'
  }
  apiWrappedModel._joinBelongsToRelations = () => t.fail('this._joinBelongsToRelations() should not be called')

  apiWrappedModel.apiFetchAll({withRelated: true})
  .then((result) => t.equal(result, 'serialized data'))
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('apiWrapper._joinBelongsToRelations() with no "relations" provided', (t) => {
  t.plan(1)

  const model = {
    name: 'someModelName',
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

  const apiWrappedModel = new ApiWrapper({model, serializer: {}, deserializer: {}, registryMock})

  t.deepEqual(
    apiWrappedModel._joinBelongsToRelations(parentRows /*, no_relations_data */),
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
    'changes relations ids into empty relations with ids'
  )

  t.end()
})

test('apiWrapper._joinBelongsToRelations() with "relations" data provided', (t) => {
  t.plan(1)

  const model = {
    name: 'someModelName',
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

  const apiWrappedModel = new ApiWrapper({model, serializer: {}, deserializer: {}, registryMock})

  t.deepEqual(
    apiWrappedModel._joinBelongsToRelations(parentRows, relationsData),
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
    'joins in relations data'
  )

  t.end()
})

test('apiWrapper._joinHasManyRelations() with "relations" data provided', (t) => {
  t.plan(1)

  const model = {
    name: 'userGroup',
    schema: {
      name: 'string',
      hide: 'boolean',
      users: {
        hasMany: 'user'
      }
    }
  }

  const fkAs = model.name + 'Id'
  const parentModelFieldName = 'group' // parent.modelFieldName

  const relationsData = [
    {
      modelFieldName: 'users',
      parentModelFieldName,
      fkAs,
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

  const apiWrappedModel = new ApiWrapper({model, serializer: {}, deserializer: {}, registryMock})

  t.deepEqual(
    apiWrappedModel._joinHasManyRelations(parentRows, relationsData),
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

test('apiWrapper._joinRelationsAndSerialize()', (t) => {
  t.plan(3)

  const serializer = {
    withoutRelated (data) {
      t.equal(data, 'joined-empty-relations row', 'passes row to serializer')
      return Promise.resolve('serialized data')
    }
  }

  const model = { name: 'someModelName' }

  const apiWrappedModel = new ApiWrapper({model, serializer, deserializer: {}, registryMock})

  // mock it for testing
  apiWrappedModel._joinBelongsToRelations = (parentRows) => {
    t.deepEqual(
      parentRows,
      [ 'parent`s row' ],
      'changes relations ids into empty relations with ids'
    )

    return [ 'joined-empty-relations row' ]
  }

  apiWrappedModel._joinRelationsAndSerialize('parent`s row')
  .then((result) => {
    t.deepEqual(
      result,
      'serialized data',
      'calls _joinBelongsToRelations() and serializes without related data'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('apiWrapper._fetchRelations()', (t) => {
  t.plan(5)

  const registryMock = {
    model (modelName) {
      const _models = {
        rights: {
          selectMany (options) {
            t.ok(options.whereIn, 'uses {whereIn} option')

            t.deepEqual(
              options.whereIn.parentWhere,
              {someField: 'parent where constraints'},
              'passes parentWhere to rel.selectMany()'
            )

            return Promise.resolve([
              {id: '12', fullName: 'Full'},
              {id: '13', fullName: 'Part'}
            ])
          },
          sqlBuilder: {
            schemaObject: {
              fullName: 'string'
            }
          }
        },

        userGroup: {
          selectMany (options) {
            t.ok(options.whereIn, 'uses {whereIn} option')

            t.deepEqual(
              options.whereIn.parentWhere,
              {someField: 'parent where constraints'},
              'passes parentWhere to rel.selectMany()'
            )

            return Promise.resolve([
              {id: '101', shortName: 'Admins'},
              {id: '102', shortName: 'Users'}
            ])
          },
          sqlBuilder: {
            schemaObject: {
              shortName: 'string'
            }
          }
        }
      }

      return _models[modelName]
    }
  }

  const model = {
    name: 'someModelName',
    registry: registryMock,
    sqlBuilder: {tableName: 'someTableName'},
    schema: {
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  }

  const apiWrappedModel = new ApiWrapper({model, serializer: {}, deserializer: {}, registryMock})

  const parentRows = [
    {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
    {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
  ]

  const parentWhere = {someField: 'parent where constraints'}

  apiWrappedModel._fetchRelations(parentRows, parentWhere)
  .then((data) => {
    t.deepEqual(
      data,
      [
        {
          id: '1', name: 'John',
          group: {id: '101', shortName: 'Admins'},
          rights: {id: '12', fullName: 'Full'}
        },
        {
          id: '2', name: 'Smith',
          group: {id: '102', shortName: 'Users'},
          rights: {id: '13', fullName: 'Part'}
        }
      ],
      'fetches relations data'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test.only('apiWrapper._fetchHasManyRelations()', (t) => {
  t.plan(2)

  const registryMock = {
    model (modelName) {
      const _models = {
        user: {
          selectMany (options) {
            t.deepEqual(
              options.whereIn,
              {
                relationFkName: 'GrpID',
                parentIdFieldName: 'GrpID',
                parentTableName: 'sPepTree',
                parentWhere: {someField: 'parent where constraints'}
              },
              'uses {whereIn} with relationFkName option'
            )

            return Promise.resolve([
              { id: '101', name: 'John', cardcode: '123', hide: false, userGroupId: '1' },
              { id: '102', name: 'Simona', cardcode: '455', hide: false, userGroupId: '1' },
              { id: '103', name: 'Whatson', cardcode: '', hide: false, userGroupId: '2' },
              { id: '104', name: 'Vaschev', cardcode: '9022', hide: false, userGroupId: '2' }
            ])
          },
          sqlBuilder: {
            tableName: 'sPersonal',
            schemaObject: {
              name: 'string',
              cardcode: 'string',
              hide: 'boolean'
            }
          }
        }
      }

      return _models[modelName]
    }
  }

  const model = {
    name: 'userGroup',
    registry: registryMock,
    sqlBuilder: { idFieldName: 'GrpID', tableName: 'sPepTree' },
    schema: {
      id: 'GrpID',
      name: 'string',
      users: {
        hasMany: 'user',
        fkField: 'GrpID'
      }
    }
  }

  const apiWrappedModel = new ApiWrapper({model, serializer: {}, deserializer: {}, registryMock})

  // mock for testing
  apiWrappedModel._hasManyRelations = [
    {
      modelName: model.schema.users.hasMany, // 'user'
      fkField: model.schema.users.fkField, // 'GrpID'
      modelFieldName: 'users', // model.schema.users
      fkAs: 'userGroupId' // model.name + 'Id'
    }
  ]

  const parentWhere = {someField: 'parent where constraints'}

  apiWrappedModel._fetchHasManyRelations(parentWhere)
  .then((data) => {
    t.deepEqual(
      data,
      [
        {
          modelFieldName: 'users',
          // parentModelFieldName: 'group', TODO when sqlBuilder.getModelFieldName() is implemented
          fkAs: 'userGroupId',
          rows: [
            { id: '101', name: 'John', cardcode: '123', hide: false, userGroupId: '1' },
            { id: '102', name: 'Simona', cardcode: '455', hide: false, userGroupId: '1' },
            { id: '103', name: 'Whatson', cardcode: '', hide: false, userGroupId: '2' },
            { id: '104', name: 'Vaschev', cardcode: '9022', hide: false, userGroupId: '2' }
          ]
        }
        // TODO add tables-for-users data
      ],
      'fetches hasMany relations data'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

/**
 * Integration testing
 */
const BaseModel = require('../../lib/models/base-model')

const dbMock = { exec () { return Promise.resolve() } }

test('I&T apiWrapper.apiCreate()', (t) => {
  t.plan(3)

  class UserModel extends BaseModel {
    create (deserializedNewData) {
      t.deepEqual(
        deserializedNewData,
        {
          name: 'John',
          rights: { id: '12' },
          userGroup: { id: '101' }
        },
      'create(newData) has been called'
      )

      return Promise.resolve({
        id: '1', // sql assigns an ID
        name: 'John',
        rightsId: '12',
        userGroupId: '101'
      })
    }
  }
  const userModel = new UserModel({
    db: dbMock, name: 'user',
    schema: {
      name: 'string',
      userGroup: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  })

  const apiWrappedUserModel = new ApiWrapper(userModel, registryMock)

  const newData = {
    data: {
      attributes: { name: 'John' },
      relationships: {
        userGroup: { data: { id: '101', type: 'user-groups' } },
        rights: { data: { id: '12', type: 'rights' } }
      },
      type: 'users'
    }
  }

  apiWrappedUserModel.apiCreate(newData)
  .then((savedSerialized) => {
    t.equal(savedSerialized.data.id, '1', 'returns with ID')

    t.deepEqual(
      savedSerialized,
      {
        data: {
          attributes: { name: 'John' },
          id: '1',
          relationships: {
            'user-group': { data: { id: '101', type: 'userGroups' } },
            rights: { data: { id: '12', type: 'rights' } }
          },
          type: 'users'
        }
      },
      'result of integration testing'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('I&T apiWrapper.apiUpdate()', (t) => {
  t.plan(3)

  class UserModel extends BaseModel {
    update (id, deserializedData) {
      t.pass('update(id, data) has been called')

      t.deepEqual(
        deserializedData,
        {
          id: '1', name: 'John',
          rights: { id: '12' },
          userGroup: { id: '101' }
        },
        'receives deserialized data'
      )

      const sqlResult = {
        id: '1', name: 'John',
        rightsId: '12',
        userGroupId: '101'
      }
      return Promise.resolve(sqlResult)
    }
  }

  const userModel = new UserModel({
    db: dbMock, name: 'user',
    schema: {
      name: 'string',
      userGroup: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  })

  const apiWrappedUserModel = new ApiWrapper(userModel, registryMock)

  const updatesData = {
    data: {
      attributes: { name: 'John' },
      id: '1',
      relationships: {
        'user-group': { data: { id: '101', type: 'user-groups' } },
        rights: { data: { id: '12', type: 'rights' } }
      },
      type: 'users'
    }
  }

  apiWrappedUserModel.apiUpdate(1, updatesData)
  .then((updatedSerialized) => {
    t.deepEqual(
      updatedSerialized,
      {
        data: {
          attributes: { name: 'John' },
          id: '1',
          relationships: {
            'user-group': { data: { id: '101', type: 'userGroups' } },
            rights: { data: { id: '12', type: 'rights' } }
          },
          type: 'users'
        }
      },
      'returns updated serialized row without relations included'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('I&T apiWrapper.apiFind()', (t) => {
  t.plan(1)

  class UserModel extends BaseModel {
    selectOne (options) {
      const rows = {
        1: {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
        2: {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
      }
      return Promise.resolve(rows[options.id])
    }
  }

  const userModel = new UserModel({
    db: dbMock, name: 'user',
    schema: {
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  })

  const apiWrappedUserModel = new ApiWrapper(userModel, registryMock)

  apiWrappedUserModel.apiFind(1)
  .then((serialized) => {
    t.deepEqual(
      serialized,
      {
        data: {
          attributes: { name: 'John' },
          id: '1',
          relationships: {
            group: { data: { id: '101', type: 'groups' } },
            rights: { data: { id: '12', type: 'rights' } }
          },
          type: 'users'
        }
      },
      'returns serialized row without relations included'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('I&T apiWrapper.apiFetchAll({withRelated: false})', (t) => {
  t.plan(1)

  class UserModel extends BaseModel {
    selectMany () {
      return Promise.resolve([
        {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
        {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
      ])
    }
  }
  const userModel = new UserModel({
    db: dbMock, name: 'user',
    schema: {
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  })

  const apiWrappedUserModel = new ApiWrapper(userModel, registryMock)

  apiWrappedUserModel.apiFetchAll()
  .then((serialized) => {
    t.deepEqual(
      serialized,
      {
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
      },
      'returns serialized rows without relations included'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('I&T apiWrapper.apiFetchAll({withRelated: true})', (t) => {
  t.plan(1)

  const registryMock = {
    model (modelName) {
      const _models = {
        rights: {
          selectMany () {
            return Promise.resolve([
              {id: '12', fullName: 'Full'},
              {id: '13', fullName: 'Part'}
            ])
          },
          attributesSerialize: ['fullName']
        },

        userGroup: {
          selectMany () {
            return Promise.resolve([
              {id: '101', shortName: 'Admins'},
              {id: '102', shortName: 'Users'}
            ])
          },
          attributesSerialize: ['shortName']
        }
      }

      return _models[modelName]
    }
  }

  class UserModel extends BaseModel {
    selectMany () {
      return Promise.resolve([
        {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
        {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
      ])
    }
  }
  const userModel = new UserModel({
    db: dbMock, registry: registryMock, name: 'user',
    schema: {
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  })

  const apiWrappedUserModel = new ApiWrapper(userModel, registryMock)

  apiWrappedUserModel.apiFetchAll({withRelated: true})
  .then((serialized) => {
    t.deepEqual(
      serialized,
      {
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
          attributes: { 'short-name': 'Admins' },
          id: '101',
          type: 'groups'
        }, {
          attributes: { 'full-name': 'Full' },
          id: '12',
          type: 'rights'
        }, {
          attributes: { 'short-name': 'Users' },
          id: '102',
          type: 'groups'
        }, {
          attributes: { 'full-name': 'Part' },
          id: '13',
          type: 'rights'
        }]
      },
      'returns serialized rows with relations data included'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})
