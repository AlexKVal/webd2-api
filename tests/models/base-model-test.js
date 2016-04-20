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
  t.throws(fn0, /schema attribute should be an object/, 'throws with not an object')

  const fn1 = function fn1 () {
    return new SomeModel(dbMock, 'name', {})
  }
  t.doesNotThrow(fn1, /schema attribute should be an object/, 'does not throw with object')

  t.end()
})

/**
 * #all
 */
class ModelForAll extends BaseModel {
  sqlAll () {}
}

test('BaseModel#all returns a Promise', (t) => {
  const model = new ModelForAll(dbMock, 'name', {})

  t.ok(model.all() instanceof Promise)
  t.end()
})

test('BaseModel#all calls db#exec', (t) => {
  t.plan(1)

  const db = {
    exec () {
      t.pass('db#exec call')
      return Promise.resolve()
    }
  }
  const model = new ModelForAll(db, 'name', {})

  model.all()
  t.end()
})

test('BaseModel#all throws error if sqlAll is not overridden', (t) => {
  class ModelAllThrows extends BaseModel {
    // sqlAll () {} is not overridden
  }
  const model = new ModelAllThrows(dbMock, 'name', {})
  t.throws(() => model.all(), /you should override sqlAll/)
  t.end()
})

test('BaseModel#all sends generated sql-query to db layer', (t) => {
  t.plan(1)

  const db = {
    exec (sql) {
      t.equal(sql, 'SELECT * FROM table')
      return Promise.resolve()
    }
  }

  class AModel extends BaseModel {
    sqlAll () { return 'SELECT * FROM table' }
  }

  const model = new AModel(db, 'name', {})
  model.all()
  t.end()
})

/**
 * #get(id)
 */
class ModelForGet extends BaseModel {
  sqlOne () {}
}

test('BaseModel#get returns a Promise', (t) => {
  const model = new ModelForGet(dbMock, 'name', {})

  t.ok(model.get(1) instanceof Promise)
  t.end()
})

test('BaseModel#get calls db#exec', (t) => {
  t.plan(1)

  const db = {
    exec () {
      t.pass('db#exec call')
      return Promise.resolve()
    }
  }
  const model = new ModelForGet(db, 'name', {})

  model.get(1)
  t.end()
})

test('BaseModel#get throws error if sqlOne is not overridden', (t) => {
  class ModelGetThrows extends BaseModel {
    // sqlOne () {} is not overridden
  }
  const model = new ModelGetThrows(dbMock, 'name', {})
  t.throws(() => model.get(1), /you should override sqlOne/)
  t.end()
})

test('BaseModel#get sends generated sql-query to db layer', (t) => {
  t.plan(1)

  const db = {
    exec (sql) {
      t.equal(sql, 'SELECT * FROM tableGet')
      return Promise.resolve()
    }
  }

  class AGetModel extends BaseModel {
    sqlOne () { return 'SELECT * FROM tableGet' }
  }

  const model = new AGetModel(db, 'name', {})
  model.get(1)
  t.end()
})

test('BaseModel#get throws error if no "id" provided', (t) => {
  class ModelForGetIdThrows extends BaseModel {
    // sqlOne () {} is not overridden
  }
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

  const model = new ModelForGet(db, 'name', {})
  model.get(1)
  .catch((e) => {
    t.pass('catch db error')
    t.assert(/db returned no data/.test(e.message), 'assert error message')
    t.end()
  })
})

test('BaseModel#get returns row if got one off db', (t) => {
  t.plan(3)

  const db = {}
  db.exec = () => Promise.resolve([{someData: 'some value'}])

  const model = new ModelForGet(db, 'name', {})
  model.get(1)
  .then((row) => {
    t.pass('get(id) resolves')
    t.assert(row, 'some data has been returned')
    t.equal(row.someData, 'some value')
    t.end()
  })
})

/**
 * #update(id, data)
 */
class ModelForUpdate extends BaseModel {
  sqlUpdate () {}
  sqlIsRowExist () {}
}

test('BaseModel#update returns a Promise', (t) => {
  const model = new ModelForUpdate(dbMock, 'name', {})

  t.ok(model.update(1, {name: 'new'}) instanceof Promise)
  t.end()
})

test('BaseModel#update throws error if sqlIsRowExist is not overridden', (t) => {
  class ModelUpdateThrows extends BaseModel {
    // sqlIsRowExist () {} is not overridden
    sqlUpdate () {}
  }
  const model = new ModelUpdateThrows(dbMock, 'name', {})
  t.throws(() => model.update(1, {name: 'new'}), /you should override sqlIsRowExist/)
  t.end()
})

test('BaseModel#update sends generated sql-query to db layer', (t) => {
  t.plan(2) // two db.exec() calls

  const db = {
    sqlQueryCounter: 0,
    exec (sql) {
      if (this.sqlQueryCounter === 0) {
        t.equal(sql, 'SELECT id FROM tableUpdate WHERE id=1', '1st query is sqlIsRowExist')
        this.sqlQueryCounter += 1
        return Promise.resolve([{some: 'row'}])
      } else if (this.sqlQueryCounter === 1) {
        t.equal(sql, 'SELECT * FROM tableUpdate', '2nd query is sqlUpdate')
        this.sqlQueryCounter += 1
        return Promise.resolve()
      } else {
        t.fail('more than two db.exec() calls')
      }
    }
  }

  class AnUpdateModel extends BaseModel {
    sqlIsRowExist (id) { return `SELECT id FROM tableUpdate WHERE id=${id}` }
    sqlUpdate () { return 'SELECT * FROM tableUpdate' }
  }

  const model = new AnUpdateModel(db, 'name', {})
  model.update(1, {name: 'new'})
  .then(() => t.end())
})

test('BaseModel#update throws error if no "id" or "data" provided', (t) => {
  const model = new ModelForUpdate(dbMock, 'name', {})
  t.throws(() => model.update(/* no id */), /no id has been provided/)
  t.throws(() => model.update(1 /* no data */), /no data has been provided/)
  t.end()
})

test('BaseModel#update throws error if no "id" or "data" provided', (t) => {
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

  const model = new ModelForUpdate(db, 'name', {})
  model.update(1, {name: 'new'})
  .catch((e) => {
    t.pass('catch error')
    t.assert(/row with id: 1 does not exist/.test(e.message), 'assert error message')
    t.end()
  })
})

test('BaseModel#update returns an updated model', (t) => {
  t.plan(4)

  const db = {
    sqlQueryCounter: 0,
    exec (sql) {
      if (this.sqlQueryCounter === 0) {
        t.pass('1st query is sqlIsRowExist')
        this.sqlQueryCounter += 1
        return Promise.resolve([{some: 'data exists'}])
      } else if (this.sqlQueryCounter === 1) {
        t.pass('2nd sqlUpdate')
        this.sqlQueryCounter += 1
        return Promise.resolve() // successful update
      } else {
        t.fail('more db.exec() calls')
      }
    }
  }

  class ModelForFullUpdate extends BaseModel {
    sqlIsRowExist (id) {}
    sqlUpdate () {}

    get () {
      // overriden for the test
      t.pass('get(id) has been called')
      return Promise.resolve({some: 'updated data'})
    }
  }
  const model = new ModelForFullUpdate(db, 'name', {})
  model.update(1, {name: 'new'})
  .then((row) => {
    t.equal(row.some, 'updated data', 'updated model has been returned')
    t.end()
  })
})

/**
 * #create(data)
 */
//
test('BaseModel#create returns saved model', (t) => {
  t.plan(3)

  const db = {
    sqlQueryCounter: 0,
    exec (sql) {
      if (this.sqlQueryCounter === 0) {
        t.pass('1st query is sqlCreate') // successful insert
        this.sqlQueryCounter += 1
        return Promise.resolve()
      } else if (this.sqlQueryCounter === 1) {
        t.pass('2nd sqlGet')
        this.sqlQueryCounter += 1
        return Promise.resolve([{saved: 'new data'}])
      } else {
        t.fail('more db.exec() calls')
      }
    }
  }

  class ModelForFullCreate extends BaseModel {
    sqlCreate () {}
    sqlDataWithID () {}
  }
  const model = new ModelForFullCreate(db, 'name', {})
  model.create({name: 'new'})
  .then((row) => {
    t.equal(row.saved, 'new data', 'saved model has been returned')
    t.end()
  })
})

/**
 * Serializer
 */
test('BaseModel#serialize(records) throws if "records" is undefined', (t) => {
  const model = new SomeModel(dbMock, 'name')
  const fn1 = function fn1 () {
    model.serialize(undefined)
  }
  t.throws(fn1, /records cannot be undefined/)

  const fn2 = function fn2 () {
    model.serialize([])
  }
  t.doesNotThrow(fn2, /records cannot be undefined/)

  t.end()
})

test('BaseModel#serialize takes into account "belongsTo" relations', (t) => {
  class UserGroup extends BaseModel {}
  const userGroup = new UserGroup(dbMock, 'user-group', {})
  const model = new SomeModel(dbMock, 'user', {
    name: 'string',
    group: {
      belongsTo: userGroup,
      fkField: 'GrpID'
    }
  })

  const serializedModel = model.serialize([
    {id: 1, name: 'Admin', userGroupId: 1}
  ])

  t.deepEqual(serializedModel, {
    data: [ { attributes: { name: 'Admin', 'user-group-id': 1 }, id: '1', type: 'users' } ]
  })

  t.end()
})

/**
 * De-serializer
 */
test('BaseModel deserializerOptions takes into account "belongsTo" relations', (t) => {
  class UserGroup extends BaseModel {}
  const userGroup = new UserGroup(dbMock, 'user-group', {})
  const model = new SomeModel(dbMock, 'user', {
    name: 'string',
    group: {
      belongsTo: userGroup,
      fkField: 'GrpID'
    }
  })

  t.equal(Object.keys(model.deserializerOptions).length, 2)
  t.equal(model.deserializerOptions.keyForAttribute, 'camelCase')
  t.ok(model.deserializerOptions['user-groups'])
  t.ok(model.deserializerOptions['user-groups'].valueForRelationship)
  t.equal(typeof model.deserializerOptions['user-groups'].valueForRelationship, 'function')

  t.end()
})

test('BaseModel#deserialize method returns Promise', (t) => {
  class UserGroup extends BaseModel {}
  const userGroup = new UserGroup(dbMock, 'user-group', {})
  class UserRights extends BaseModel {}
  const userRights = new UserRights(dbMock, 'user-rights', {})

  const model = new SomeModel(dbMock, 'user', {
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

  model.deserialize({
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

/**
 * belongsTo
 */
test('BaseModel#apiFetchAll uses all() method under the hood', (t) => {
  t.plan(1)

  class ModelForFetchAll extends BaseModel {
    all () {
      t.pass('all() called')
      return Promise.resolve()
    }
  }

  const model = new ModelForFetchAll(dbMock, 'user', {})

  model.apiFetchAll()
  .then(() => t.end())
})

test('BaseModel#apiFetchAll returns cast and serialized data', (t) => {
  t.plan(2)

  class ModelForFetchAll extends BaseModel {
    all () {
      t.pass('all() called')

      return Promise.resolve([
        {id: '1', name: 'Mathew', enabled: '0'},
        {id: '2', name: 'John', enabled: '1'}
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

test('BaseModel#_fetchBelongsToRelations fetches relations data', (t) => {
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

  userModel._fetchBelongsToRelations(parentRows)
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

test('BaseModel#_replaceRelIDsByRelations with no "relations" provided changes relations ids into empty relations with ids', (t) => {
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

  const dataSet = userModel._replaceRelIDsByRelations(parentRows /*, no_relations_data */)
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

test('BaseModel#_replaceRelIDsByRelations with "relations" data provided joins in relations data', (t) => {
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

  const dataSet = userModel._replaceRelIDsByRelations(parentRows, relationsData)
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
      return Promise.resolve(rows[id])
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
      return Promise.resolve({
        id: '1', name: 'John',
        rightsId: '12',
        userGroupId: '101'
      })
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

  class UserModel extends BaseModel {
    deserialize () {
      t.pass('deserialize() has been called')
      return Promise.reject(new Error('some deserialization error'))
    }
  }
  const userModel = new UserModel(dbMock, 'user', { name: 'string' })

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
      return Promise.resolve({
        id: '1', // sql assigns an ID
        name: 'John',
        rightsId: '12',
        userGroupId: '101'
      })
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

  class UserModel extends BaseModel {
    deserialize () {
      t.pass('deserialize() has been called')
      return Promise.reject(new Error('some deserialization error'))
    }
  }
  const userModel = new UserModel(dbMock, 'user', { name: 'string' })

  userModel.apiCreate({})
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.equal(e.message, 'some deserialization error')
  })
  .then(() => t.end())
})
