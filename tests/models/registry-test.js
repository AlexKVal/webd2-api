'use strict'

const test = require('tape')

const registry = require('../../lib/models/registry')
const BaseModel = require('../../lib/models/base-model')

const dbMock = { exec () { return Promise.resolve() } }

test.only('registry is a `singleton` store for models', (t) => {
  t.equal(
    registry.model('User'),
    undefined,
    'at the beginning there is no registered `User` model'
  )

  class User extends BaseModel {}
  User.schemaObject = {
    tableName: 'sPersonal',
    id: 'PersID',

    name: 'string'
  }

  t.ok(registry.model('User', User, dbMock), 'register model')

  t.equal(
    registry.model('User').name,
    'User',
    'retrieve registered model'
  )

  t.throws(
    () => registry.model('User', User, dbMock),
    /User is already defined in the registry/,
    'it prevents to overwrite registered models'
  )

  class OtherModel extends BaseModel {}
  /* OtherModel.schemaObject left undefined */

  t.throws(
    () => registry.model('OtherModel', OtherModel, dbMock),
    /you need to define `ModelClass.schemaObject`/,
    'it hints for schemaObject'
  )

  t.end()
})
