'use strict'
const test = require('tape')

const ApiWrapper = require('../../lib/api/api-wrapper')

test('ApiWrapper', (t) => {
  const someModelMock = { name: 'some-model-name' }
  const apiWrappedSomeModel = new ApiWrapper({model: someModelMock, serializer: {}, deserializer: {}})

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

  const apiWrappedModel = new ApiWrapper({model, deserializer, serializer: {}})

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

  const apiWrappedModel = new ApiWrapper({model, deserializer, serializer: {}})

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

  const apiWrappedModel = new ApiWrapper({ model, deserializer: {}, serializer: {} })

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

  const apiWrappedModel = new ApiWrapper({model, serializer: serializer, deserializer: {}})

  // mock it for testing
  apiWrappedModel._joinRelations = (parentRows) => {
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

  const apiWrappedModel = new ApiWrapper({model, serializer: serializer, deserializer: {}})

  // mock it for testing
  apiWrappedModel._fetchRelations = (parentRows) => {
    t.equal(
      parentRows,
      'data from selectMany',
      'joins relations and serializes the result from model.update()'
    )

    return '"joined" data'
  }
  apiWrappedModel._joinRelations = () => t.fail('this._joinRelations() should not be called')

  apiWrappedModel.apiFetchAll({withRelated: true})
  .then((result) => t.equal(result, 'serialized data'))
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('apiWrapper._joinRelations() with no "relations" provided', (t) => {
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

  const apiWrappedModel = new ApiWrapper({model, serializer: {}, deserializer: {}})

  t.deepEqual(
    apiWrappedModel._joinRelations(parentRows /*, no_relations_data */),
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

test('apiWrapper._joinRelations() with "relations" data provided', (t) => {
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

  const apiWrappedModel = new ApiWrapper({model, serializer: {}, deserializer: {}})

  t.deepEqual(
    apiWrappedModel._joinRelations(parentRows, relationsData),
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

test('apiWrapper._joinRelationsAndSerialize()', (t) => {
  t.plan(3)

  const serializer = {
    withoutRelated (data) {
      t.equal(data, 'joined-empty-relations row', 'passes row to serializer')
      return Promise.resolve('serialized data')
    }
  }

  const model = { name: 'someModelName' }

  const apiWrappedModel = new ApiWrapper({model, serializer: serializer, deserializer: {}})

  // mock it for testing
  apiWrappedModel._joinRelations = (parentRows) => {
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
      'calls _joinRelations() and serializes without related data'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})
