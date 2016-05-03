'use strict'
const test = require('tape')

const ApiWrapper = require('../../lib/api/api-wrapper')

test('ApiWrapper', (t) => {
  const someModelMock = { name: 'some-model-name' }
  const apiWrappedSomeModel = new ApiWrapper({model: someModelMock})

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

  const apiWrappedModel = new ApiWrapper({model, deserializer})

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
