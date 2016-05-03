'use strict'
const test = require('tape')

const ApiWrapper = require('../../lib/api/api-wrapper')

test.only('ApiWrapper', (t) => {
  const someModelMock = { name: 'some-model-name' }
  const apiWrappedSomeModel = new ApiWrapper(someModelMock)

  t.throws(
    () => new ApiWrapper(),
    /ApiWrapper needs a model/,
    'needs a model'
  )

  t.throws(
    () => new ApiWrapper({}),
    /ApiWrapper needs a model/,
    'model should be with a name'
  )

  t.equal(apiWrappedSomeModel.model, someModelMock, '`model` property holds a model')

  t.end()
})
