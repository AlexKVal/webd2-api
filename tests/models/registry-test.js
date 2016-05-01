'use strict'

const test = require('tape')

const registry = require('../../lib/models/registry')
const BaseModel = require('../../lib/models/base-model')

const dbMock = { exec () { return Promise.resolve() } }

test('registry is a `singleton` store for models', (t) => {
  t.equal(
    registry.model('User'),
    undefined,
    'at the beginning there is no registered `user` model'
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
    'user',
    'retrieve registered model'
  )

  t.throws(
    () => registry.model('User', User, dbMock),
    /user is already defined in the registry/,
    'it prevents to overwrite registered models'
  )

  class OtherModel extends BaseModel {}
  /* OtherModel.schemaObject left undefined */

  t.throws(
    () => registry.model('OtherModel', OtherModel, dbMock),
    /you need to define `ModelClass.schemaObject`/,
    'it hints about absent schemaObject'
  )

  const userModel = registry.model('User')
  t.equal(
    userModel.registry,
    registry,
    'it injects itself to models'
  )

  class UserAccount extends BaseModel {}
  UserAccount.schemaObject = { tableName: 'sPersonal', id: 'PersID', name: 'string' }
  const userAccountModel = registry.model('UserAccount', UserAccount, dbMock)

  t.equal(
    registry.model('user-account'),
    userAccountModel,
    'it auto camelCase`s model`s names'
  )

  t.equal(
    registry.model('user account'),
    userAccountModel,
    'it auto camelCase`s model`s names'
  )

  t.equal(
    registry.model('User Account'),
    userAccountModel,
    'it auto camelCase`s model`s names'
  )

  t.end()
})
