'use strict'
const test = require('tape')

const BaseModel = require('../../lib/models/base-model')

const dbMock = {
  exec () {
    return Promise.resolve()
  }
}
class SomeModel extends BaseModel {}

test('BaseModel is abstract class', (t) => {
  const fn1 = function fn1 () {
    return new BaseModel(dbMock, 'name')
  }
  t.throws(fn1, /is abstract class/)

  const fn2 = function fn2 () {
    return new SomeModel(dbMock, 'name')
  }
  t.doesNotThrow(fn2, /is abstract class/)

  t.end()
})

test('BaseModel needs database layer', (t) => {
  const fn = function fn () {
    return new SomeModel()
  }
  t.throws(fn, /database is undefined/, 'throws when no "database" provided')
  t.end()
})

test('BaseModel constructor gets name and optionally schema', (t) => {
  const fn = function fn () {
    return new SomeModel(dbMock)
  }
  t.throws(fn, /name is undefined/, 'throws when no "name" provided')
  t.end()
})

test('BaseModel if schema is not provided, then default one is created', (t) => {
  const model = new SomeModel(dbMock, 'some-name')

  t.equal(model.name, 'some-name')
  t.ok((model.schema instanceof Object))
  t.end()
})

test('BaseModel throws if "schema" is not an object', (t) => {
  const fn0 = function fn0 () {
    return new SomeModel(dbMock, 'name', 'any non object')
  }
  t.throws(fn0, /descriptors attribute should be an object/, 'throws with not an object')

  const fn1 = function fn1 () {
    return new SomeModel(dbMock, 'name', {})
  }
  t.doesNotThrow(fn1, /descriptors attribute should be an object/, 'does not throw with object')

  t.end()
})

/**
 * #all
 */
test('BaseModel#all calls db#exec and returns cast types', (t) => {
  t.plan(4)

  const db = {
    exec (sql) {
      t.pass('db#exec call')
      t.equal(sql, 'SELECT * FROM table', 'sends sql-query to db layer')
      return Promise.resolve([{
        enabled: '0',
        disabled: '1',
        counter: '123'
      }])
    }
  }

  class ModelForAll extends BaseModel {
    sqlAll () { return 'SELECT * FROM table' }
  }
  const model = new ModelForAll(db, 'name', {
    enabled: 'boolean',
    disabled: 'boolean',
    counter: 'integer'
  })

  model.all()
  .then((castData) => { t.pass('returns a Promise'); return castData })
  .then((castData) => {
    t.deepEqual(castData, [{
      enabled: false,
      disabled: true,
      counter: 123
    }])
  })
  .catch((e) => t.fail(`should not be called ${e}`))
  .then(() => t.end())
})

test('BaseModel#all throws error if sqlAll is not overridden', (t) => {
  class ModelAllThrows extends BaseModel {
    // sqlAll () {} is not overridden
  }
  const model = new ModelAllThrows(dbMock, 'name', {})
  t.throws(() => model.all(), /you should override sqlAll/)
  t.end()
})

/**
 * get(id)
 */
test('BaseModel#get calls db#exec and returns cast data', (t) => {
  t.plan(4)

  const db = {
    exec (sql) {
      t.pass('db#exec call')
      t.equal(sql, 'SELECT * FROM tableGet', 'passes sql-query to db-layer')
      return Promise.resolve([{
        enabled: '0',
        disabled: '1',
        counter: '123'
      }])
    }
  }

  class ModelForGet extends BaseModel {
    sqlOne () { return 'SELECT * FROM tableGet' }
  }
  const model = new ModelForGet(db, 'name', {
    enabled: 'boolean',
    disabled: 'boolean',
    counter: 'integer'
  })

  model.get(1)
  .then((castData) => {
    t.pass('returns a Promise')
    t.deepEqual(castData, [{
      enabled: false,
      disabled: true,
      counter: 123
    }])
  })
  .catch((e) => t.fail(`should not be called ${e}`))
  .then(() => t.end())
})

test('BaseModel#get throws error if sqlOne is not overridden', (t) => {
  class ModelGetThrows extends BaseModel {
    // sqlOne () {} is not overridden
  }
  const model = new ModelGetThrows(dbMock, 'name', {})
  t.throws(() => model.get(1), /you should override sqlOne/)
  t.end()
})

test('BaseModel#get throws error if no "id" provided', (t) => {
  class ModelForGetIdThrows extends BaseModel {}
  const model = new ModelForGetIdThrows(dbMock, 'name', {})
  t.throws(() => model.get(/* no id */), /no id has been provided/)
  t.end()
})

test('BaseModel#get rejects with error if db returns no rows', (t) => {
  t.plan(3)

  const db = {
    exec () {
      t.pass('db#exec call')
      return Promise.resolve([/* no rows */])
    }
  }

  class ModelForGet extends BaseModel {
    sqlOne () {}
  }
  const model = new ModelForGet(db, 'name', {})
  model.get(1)
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.pass('catch db error')
    t.assert(/db returned no data/.test(e.message), 'assert error message')
    t.end()
  })
})

/**
 * update(id, data)
 */
test('BaseModel#update throws error if sqlIsRowExist is not overridden', (t) => {
  class ModelUpdateThrows extends BaseModel {
    // sqlIsRowExist () {} is not overridden
    sqlUpdate () {}
  }
  const model = new ModelUpdateThrows(dbMock, 'name', {})
  t.throws(() => model.update(1, {name: 'new'}), /you should override sqlIsRowExist/)
  t.end()
})

test('BaseModel#update throws error if no "id" or "data" provided', (t) => {
  class ModelForUpdate extends BaseModel {
    sqlUpdate () {}
    sqlIsRowExist () {}
  }

  const model = new ModelForUpdate(dbMock, 'name', {})
  t.throws(() => model.update(/* no id */), /no id has been provided/)
  t.throws(() => model.update(1 /* no data */), /no data has been provided/)
  t.end()
})

test('BaseModel#update rejects with error if no row with "id" exists', (t) => {
  t.plan(3)

  const db = {
    sqlQueryCounter: 0,
    exec (sql) {
      if (this.sqlQueryCounter === 0) {
        t.pass('1st query is sqlIsRowExist')
        this.sqlQueryCounter += 1
        return Promise.resolve([/* no row with id has been found */])
      } else if (this.sqlQueryCounter === 1) {
        t.fail('if row with "id" not found it should not call sqlUpdate')
        this.sqlQueryCounter += 1
        return Promise.resolve()
      } else {
        t.fail('more db.exec() calls')
      }
    }
  }

  class ModelForUpdate extends BaseModel {
    sqlUpdate () {}
    sqlIsRowExist () {}
  }

  const model = new ModelForUpdate(db, 'name', {})
  model.update(1, {name: 'new'})
  .catch((e) => {
    t.pass('catch error')
    t.assert(/row with id: 1 does not exist/.test(e.message), 'assert error message')
    t.end()
  })
})

test('BaseModel#update calls db.exec, calls get(id), and returns a result from it', (t) => {
  t.plan(5)

  const db = {
    sqlQueryCounter: 0,
    exec (sql) {
      if (this.sqlQueryCounter === 0) {
        t.equal(sql, '1st query is sqlIsRowExist', 'sends sql-query to db layer')
        this.sqlQueryCounter += 1
        return Promise.resolve([{some: 'data exists'}])
      } else if (this.sqlQueryCounter === 1) {
        t.equal(sql, '2nd sqlUpdate', 'sends sql-query to db layer')
        this.sqlQueryCounter += 1
        return Promise.resolve() // successful update
      } else {
        t.fail('more db.exec() calls')
      }
    }
  }

  class ModelForFullUpdate extends BaseModel {
    sqlIsRowExist (id) { return '1st query is sqlIsRowExist' }
    sqlUpdate () { return '2nd sqlUpdate' }

    get () {
      // overriden for the test
      t.pass('get(id) has been called')
      return Promise.resolve([{
        enabled: false,
        disabled: true,
        counter: 0
      }])
    }
  }
  const model = new ModelForFullUpdate(db, 'name', {
    enabled: 'boolean',
    disabled: 'boolean',
    counter: 'integer'
  })

  model.update(1, {counter: 0})
  .then((castData) => {
    t.pass('returns a Promise')
    t.deepEqual(castData, [{
      enabled: false,
      disabled: true,
      counter: 0
    }])
  })
  .catch((e) => t.fail(`should not be called ${e}`))
  .then(() => t.end())
})

/**
 * create(data)
 */
test('BaseModel#create calls db.exec and returns saved model with cast types', (t) => {
  t.plan(4)

  const db = {
    sqlQueryCounter: 0,
    exec (sql) {
      if (this.sqlQueryCounter === 0) {
        t.equal(sql, '1st query is sqlCreate', 'sends sql-query to db layer')
        this.sqlQueryCounter += 1
        return Promise.resolve(/* OK */)
      } else if (this.sqlQueryCounter === 1) {
        t.equal(sql, '2nd sqlGet', 'sends sql-query to db layer')
        this.sqlQueryCounter += 1
        return Promise.resolve([{
          id: '1', // db-layer generates ID
          enabled: '0',
          disabled: '1',
          counter: '123'
        }])
      } else {
        t.fail('more db.exec() calls')
      }
    }
  }

  class ModelForFullCreate extends BaseModel {
    sqlCreate () { return '1st query is sqlCreate' }
    sqlDataWithID () { return '2nd sqlGet' }
  }
  const model = new ModelForFullCreate(db, 'name', {
    enabled: 'boolean',
    disabled: 'boolean',
    counter: 'integer'
  })

  model.create({
    enabled: false,
    disabled: true,
    counter: 0
  })
  .then((castData) => {
    t.pass('returns a Promise')
    t.deepEqual(castData, [{
      id: '1',
      enabled: false,
      disabled: true,
      counter: 123
    }])
  })
  .catch((e) => t.fail(`should not be called ${e}`))
  .then(() => t.end())
})

/**
 * belongsTo
 */
test('BaseModel#apiFetchAll calls all() and returns serialized data', (t) => {
  t.plan(2)

  class ModelForFetchAll extends BaseModel {
    all () {
      t.pass('all() called')

      return Promise.resolve([
        {id: '1', name: 'Mathew', enabled: false},
        {id: '2', name: 'John', enabled: true}
      ])
    }
  }

  const model = new ModelForFetchAll(dbMock, 'user', {
    name: 'string',
    enabled: 'boolean'
  })

  model.apiFetchAll()
  .then((data) => {
    t.deepEqual(data, {
      data: [
        { attributes: { enabled: false, name: 'Mathew' }, id: '1', type: 'users' },
        { attributes: { enabled: true, name: 'John' }, id: '2', type: 'users' }
      ]
    })
  })
  .catch(() => t.fail('should not be called'))
  .then(() => t.end())
})

test('BaseModel#_fetchRelations fetches relations data', (t) => {
  t.plan(1)

  class GroupModel extends BaseModel {
    all () {
      return Promise.resolve([
        {id: '101', name: 'Admins'},
        {id: '102', name: 'Users'}
      ])
    }
  }
  const groupModel = new GroupModel(dbMock, 'user-group', {
    name: 'string'
  })

  class RightsModel extends BaseModel {
    all () {
      return Promise.resolve([
        {id: '12', name: 'Full'},
        {id: '13', name: 'Part'}
      ])
    }
  }
  const rightsModel = new RightsModel(dbMock, 'rights', {
    name: 'string'
  })

  class UserModel extends BaseModel {}
  const userModel = new UserModel(dbMock, 'user', {
    name: 'string',
    group: { belongsTo: groupModel },
    rights: { belongsTo: rightsModel }
  })

  const parentRows = [
    {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
    {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
  ]

  userModel._fetchRelations(parentRows)
  .then((data) => {
    t.deepEqual(data, [
      {
        id: '1', name: 'John',
        group: {id: '101', name: 'Admins'},
        rights: {id: '12', name: 'Full'}
      },
      {
        id: '2', name: 'Smith',
        group: {id: '102', name: 'Users'},
        rights: {id: '13', name: 'Part'}
      }
    ])
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('BaseModel#apiFetchAll({withRelated: true}) returns serialized rows with relations data included', (t) => {
  t.plan(1)

  class GroupModel extends BaseModel {
    all () {
      return Promise.resolve([
        {id: '101', name: 'Admins'},
        {id: '102', name: 'Users'}
      ])
    }
  }
  const groupModel = new GroupModel(dbMock, 'user-group', {
    name: 'string'
  })

  class RightsModel extends BaseModel {
    all () {
      return Promise.resolve([
        {id: '12', name: 'Full'},
        {id: '13', name: 'Part'}
      ])
    }
  }
  const rightsModel = new RightsModel(dbMock, 'rights', {
    name: 'string'
  })

  class UserModel extends BaseModel {
    all () {
      return Promise.resolve([
        {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
        {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
      ])
    }
  }
  const userModel = new UserModel(dbMock, 'user', {
    name: 'string',
    group: { belongsTo: groupModel },
    rights: { belongsTo: rightsModel }
  })

  userModel.apiFetchAll({withRelated: true})
  .then((serialized) => {
    t.deepEqual(serialized, {
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
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('BaseModel#_joinRelations with no "relations" provided changes relations ids into empty relations with ids', (t) => {
  t.plan(1)

  class GroupModel extends BaseModel {}
  const groupModel = new GroupModel(dbMock, 'user-group', {
    name: 'string'
  })

  class RightsModel extends BaseModel {}
  const rightsModel = new RightsModel(dbMock, 'rights', {
    name: 'string'
  })

  class UserModel extends BaseModel {}
  const userModel = new UserModel(dbMock, 'user', {
    name: 'string',
    group: { belongsTo: groupModel },
    rights: { belongsTo: rightsModel }
  })

  const parentRows = [
    {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
    {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
  ]

  const dataSet = userModel._joinRelations(parentRows /*, no_relations_data */)
  t.deepEqual(dataSet, [
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
  ])

  t.end()
})

test('BaseModel#_joinRelations with "relations" data provided joins in relations data', (t) => {
  t.plan(1)

  class GroupModel extends BaseModel {}
  const groupModel = new GroupModel(dbMock, 'user-group', {
    name: 'string'
  })

  class RightsModel extends BaseModel {}
  const rightsModel = new RightsModel(dbMock, 'rights', {
    name: 'string'
  })

  class UserModel extends BaseModel {}
  const userModel = new UserModel(dbMock, 'user', {
    name: 'string',
    group: { belongsTo: groupModel },
    rights: { belongsTo: rightsModel }
  })

  const parentRows = [
    {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
    {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
  ]

  const relationsData = [
    {
      name: 'group',
      fkName: 'userGroupId',
      rows: [
        {id: '101', name: 'Admins'},
        {id: '102', name: 'Users'}
      ]
    },
    {
      name: 'rights',
      fkName: 'rightsId',
      rows: [
        {id: '12', name: 'Full'},
        {id: '13', name: 'Part'}
      ]
    }
  ]

  const dataSet = userModel._joinRelations(parentRows, relationsData)
  t.deepEqual(dataSet, [
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

  t.end()
})

test('BaseModel#apiFetchAll({withRelated: false}) returns serialized rows without relations included', (t) => {
  t.plan(1)

  class GroupModel extends BaseModel {}
  const groupModel = new GroupModel(dbMock, 'user-group', {
    name: 'string'
  })

  class RightsModel extends BaseModel {}
  const rightsModel = new RightsModel(dbMock, 'rights', {
    name: 'string'
  })

  class UserModel extends BaseModel {
    all () {
      return Promise.resolve([
        {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
        {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
      ])
    }
  }
  const userModel = new UserModel(dbMock, 'user', {
    name: 'string',
    group: { belongsTo: groupModel },
    rights: { belongsTo: rightsModel }
  })

  userModel.apiFetchAll()
  .then((serialized) => {
    t.deepEqual(serialized, {
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
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('BaseModel#apiFind(id) calls get(id) and serializes row without relations included', (t) => {
  t.plan(1)

  class GroupModel extends BaseModel {}
  const groupModel = new GroupModel(dbMock, 'user-group', {
    name: 'string'
  })

  class RightsModel extends BaseModel {}
  const rightsModel = new RightsModel(dbMock, 'rights', {
    name: 'string'
  })

  class UserModel extends BaseModel {
    get (id) {
      const rows = {
        1: {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
        2: {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
      }
      return Promise.resolve([rows[id]])
    }
  }
  const userModel = new UserModel(dbMock, 'user', {
    name: 'string',
    group: { belongsTo: groupModel },
    rights: { belongsTo: rightsModel }
  })

  userModel.apiFind(1)
  .then((serialized) => {
    t.deepEqual(serialized, {
      data: {
        attributes: { name: 'John' },
        id: '1',
        relationships: {
          group: { data: { id: '101', type: 'groups' } },
          rights: { data: { id: '12', type: 'rights' } }
        },
        type: 'users'
      }
    })
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('BaseModel#apiUpdate calls update() and returns updated serialized row without relations included', (t) => {
  t.plan(3)

  class GroupModel extends BaseModel {}
  const groupModel = new GroupModel(dbMock, 'user-group', { name: 'string' })

  class RightsModel extends BaseModel {}
  const rightsModel = new RightsModel(dbMock, 'rights', { name: 'string' })

  class UserModel extends BaseModel {
    update (id, deserializedData) {
      t.pass('update(id, data) has been called')

      t.deepEqual(deserializedData, {
        id: '1', name: 'John',
        rights: { id: '12' },
        userGroup: { id: '101' }
      })
      return Promise.resolve([{
        id: '1', name: 'John',
        rightsId: '12',
        userGroupId: '101'
      }])
    }
  }
  const userModel = new UserModel(dbMock, 'user', {
    name: 'string',
    userGroup: { belongsTo: groupModel },
    rights: { belongsTo: rightsModel }
  })

  const updatesData = {
    data: {
      attributes: { name: 'John' },
      id: '1',
      relationships: {
        userGroup: { data: { id: '101', type: 'user-groups' } },
        rights: { data: { id: '12', type: 'rights' } }
      },
      type: 'users'
    }
  }

  userModel.apiUpdate(1, updatesData)
  .then((updatedSerialized) => {
    t.deepEqual(updatedSerialized, {
      data: {
        attributes: { name: 'John' },
        id: '1',
        relationships: {
          'user-group': { data: { id: '101', type: 'userGroups' } },
          rights: { data: { id: '12', type: 'rights' } }
        },
        type: 'users'
      }
    })
  })
  .catch((e) => t.fail(`should not be called. ${e}`))
  .then(() => t.end())
})

test('BaseModel#apiUpdate returns error from "update"', (t) => {
  t.plan(2)

  class UserModel extends BaseModel {
    update (id, deserializedData) {
      t.pass('update(id, data) has been called')
      return Promise.reject(new Error('some error'))
    }
  }
  const userModel = new UserModel(dbMock, 'user', { name: 'string' })

  const updatesData = {
    data: {
      attributes: { name: 'John' },
      id: '1',
      type: 'users'
    }
  }

  userModel.apiUpdate(1, updatesData)
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.equal(e.message, 'some error')
  })
  .then(() => t.end())
})

test('BaseModel#apiUpdate returns error from "deserialize"', (t) => {
  t.plan(2)

  class UserModel extends BaseModel {}
  const userModel = new UserModel(dbMock, 'user', { name: 'string' })
  userModel.serializer.deserialize = () => {
    t.pass('deserialize() has been called')
    return Promise.reject(new Error('some deserialization error'))
  }

  userModel.apiUpdate(1, {})
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.equal(e.message, 'some deserialization error')
  })
  .then(() => t.end())
})

test('BaseModel#apiCreate calls create() and returns saved serialized row without relations included', (t) => {
  t.plan(4)

  class GroupModel extends BaseModel {}
  const groupModel = new GroupModel(dbMock, 'user-group', { name: 'string' })

  class RightsModel extends BaseModel {}
  const rightsModel = new RightsModel(dbMock, 'rights', { name: 'string' })

  class UserModel extends BaseModel {
    create (deserializedNewData) {
      t.pass('create(newData) has been called')

      t.deepEqual(deserializedNewData, {
        id: undefined, // it's added by deserializer
        name: 'John',
        rights: { id: '12' },
        userGroup: { id: '101' }
      })
      return Promise.resolve([{
        id: '1', // sql assigns an ID
        name: 'John',
        rightsId: '12',
        userGroupId: '101'
      }])
    }
  }
  const userModel = new UserModel(dbMock, 'user', {
    name: 'string',
    userGroup: { belongsTo: groupModel },
    rights: { belongsTo: rightsModel }
  })

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

  userModel.apiCreate(newData)
  .then((savedSerialized) => {
    t.equal(savedSerialized.data.id, '1', 'returns with ID')

    t.deepEqual(savedSerialized, {
      data: {
        attributes: { name: 'John' },
        id: '1',
        relationships: {
          'user-group': { data: { id: '101', type: 'userGroups' } },
          rights: { data: { id: '12', type: 'rights' } }
        },
        type: 'users'
      }
    })
  })
  .catch((e) => t.fail(`should not be called. ${e}`))
  .then(() => t.end())
})

test('BaseModel#apiCreate returns error from "update"', (t) => {
  t.plan(2)

  class UserModel extends BaseModel {
    create (deserializedData) {
      t.pass('create() has been called')
      return Promise.reject(new Error('some error'))
    }
  }
  const userModel = new UserModel(dbMock, 'user', { name: 'string' })

  const newData = {
    data: {
      attributes: { name: 'John' },
      type: 'users'
    }
  }

  userModel.apiCreate(newData)
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.equal(e.message, 'some error')
  })
  .then(() => t.end())
})

test('BaseModel#apiCreate returns error from "deserialize"', (t) => {
  t.plan(2)

  class UserModel extends BaseModel {}
  const userModel = new UserModel(dbMock, 'user', { name: 'string' })
  userModel.serializer.deserialize = () => {
    t.pass('deserialize() has been called')
    return Promise.reject(new Error('some deserialization error'))
  }

  userModel.apiCreate({})
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.equal(e.message, 'some deserialization error')
  })
  .then(() => t.end())
})
