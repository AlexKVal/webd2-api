'use strict'
const test = require('tape')

const BaseModel = require('../../lib/models/base-model')

const dbMock = { exec () { return Promise.resolve() } }
const registry = { model (modelName) { return { name: modelName } } }

class SomeModel extends BaseModel {}

test('BaseModel is abstract class', (t) => {
  t.throws(
    () => new BaseModel({db: dbMock, registry, name: 'name', schema: {}}),
    /is abstract class/
  )

  t.doesNotThrow(
    () => new SomeModel({db: dbMock, registry, name: 'name', schema: {}}),
    /is abstract class/
  )

  t.end()
})

test('BaseModel constructor requires parameters', (t) => {
  t.throws(
    () => new SomeModel({}),
    /database is undefined/,
    'throws when no "database" provided'
  )

  t.throws(
    () => new SomeModel({db: dbMock}),
    /name is undefined/,
    'throws when no "name" provided'
  )

  t.throws(
    () => new SomeModel({db: dbMock, registry, name: 'model-name'}),
    /schema is not provided/,
    'throws when no "schema" provided'
  )

  t.throws(
    () => new SomeModel({db: dbMock, name: 'model-name', schema: {}}),
    /registry is not provided/,
    'throws when no "registry" provided'
  )

  t.throws(
    () => new SomeModel({db: dbMock, registry, name: 'name', schema: 'any non object'}),
    /schema attribute should be an object/,
    'throws if "schema" is not an object'
  )

  t.end()
})

/**
 * selectMany(options)
 */
test('BaseModel#selectMany calls db.exec() and returns cast types', (t) => {
  t.plan(4)

  const db = {
    exec (sql) {
      t.pass('db.exec() called')
      t.equal(sql, 'SELECT id, enabled, disabled, counter FROM some')
      return Promise.resolve([{
        enabled: '0',
        disabled: '1',
        counter: '123'
      }])
    }
  }

  class ModelForAll extends BaseModel {}
  const model = new ModelForAll({db, registry, name: 'name', schema: {
    tableName: 'some',
    enabled: 'boolean',
    disabled: 'boolean',
    counter: 'integer'
  }})

  model.selectMany()
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

test('BaseModel#selectMany(options) accepts `options` for sqlBuilder.selectMany()', (t) => {
  t.plan(3)

  const db = {
    exec (sql) {
      t.pass('db.exec() called')
      t.equal(
        sql,
        'SELECT id, name, hide, counter FROM sPersonal WHERE hide=false ORDER BY name',
        'sql query with regards to `options`'
      )
      return Promise.resolve([])
    }
  }

  class User extends BaseModel {}
  const model = new User({db, registry, name: 'user', schema: {
    tableName: 'sPersonal',
    name: 'string',
    hide: 'boolean',
    counter: 'integer'
  }})

  model.selectMany({where: {hide: false}, orderBy: 'name'})
  .then(() => t.pass('returns a Promise'))
  .catch((e) => t.fail(`should not be called ${e}`))
  .then(() => t.end())
})

/**
 * selectOne(options)
 */
test('BaseModel#selectOne(options) accepts `options` for sqlBuilder.selectOne()', (t) => {
  t.plan(5)

  const db = {
    exec (sql) {
      t.pass('db.exec() called')
      t.equal(
        sql,
        'SELECT id, enabled FROM some WHERE id=1',
        'passes `options` to the underlying sqlBuilder'
      )
      return Promise.resolve([{
        enabled: '0',
        disabled: '1',
        counter: '123'
      }])
    }
  }

  class ModelForGet extends BaseModel {}
  const model = new ModelForGet({db, registry, name: 'name', schema: {
    tableName: 'some',
    enabled: 'boolean',
    disabled: 'boolean',
    counter: 'integer'
  }})

  t.throws(() => model.selectOne(/* no id */), /either `id` or `data` option should be provided/)

  model.selectOne({id: 1, fieldsOnly: ['enabled']})
  .then((castData) => {
    t.pass('returns a Promise')
    t.deepEqual(
      castData,
      {
        enabled: false,
        disabled: true,
        counter: 123
      },
      'returns one row with cast-type values'
    )
  })
  .catch((e) => t.fail(`should not be called ${e}`))
  .then(() => t.end())
})

test('BaseModel#selectOne rejects with error if db returns no rows', (t) => {
  t.plan(3)

  const db = {
    exec () {
      t.pass('db.exec call')
      return Promise.resolve([/* no rows */])
    }
  }

  class ModelForGet extends BaseModel {}
  const model = new ModelForGet({db, registry, name: 'name', schema: {tableName: 'some'}})
  model.selectOne({id: 1})
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
test('BaseModel#update throws error if no "id" or "data" provided', (t) => {
  class ModelForUpdate extends BaseModel {}
  const model = new ModelForUpdate({db: dbMock, registry, name: 'name', schema: {}})
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
        t.equal(sql, 'SELECT id FROM some WHERE id=1', '"is row exists" query')
        this.sqlQueryCounter += 1
        return Promise.resolve([/* no row with id has been found */])
      } else if (this.sqlQueryCounter === 1) {
        t.fail('if row with "id" not found it should not call update')
        this.sqlQueryCounter += 1
        return Promise.resolve()
      } else {
        t.fail('more db.exec() calls')
      }
    }
  }

  class ModelForUpdate extends BaseModel {}
  const model = new ModelForUpdate({db, registry, name: 'name', schema: {tableName: 'some'}})
  model.update(1, {name: 'new'})
  .catch((e) => {
    t.pass('catch error')
    t.assert(/row with id: 1 does not exist/.test(e.message), 'assert error message')
    t.end()
  })
})

test('BaseModel#update calls db.exec, calls selectOne(), and returns a result from it', (t) => {
  t.plan(6)

  const db = {
    sqlQueryCounter: 0,
    exec (sql) {
      if (this.sqlQueryCounter === 0) {
        t.equal(sql, 'SELECT id FROM some WHERE id=12', 'sends sql-query to db layer')
        this.sqlQueryCounter += 1
        return Promise.resolve([{some: 'data exists'}])
      } else if (this.sqlQueryCounter === 1) {
        t.equal(sql, 'UPDATE some SET counter=0 WHERE id=12', 'sends sql-query to db layer')
        this.sqlQueryCounter += 1
        return Promise.resolve() // successful update
      } else {
        t.fail('more db.exec() calls')
      }
    }
  }

  class ModelForFullUpdate extends BaseModel {
    selectOne (options) {
      // overriden for the test
      t.pass('selectOne() has been called')
      t.equal(options.id, 12)
      return Promise.resolve([{
        enabled: false,
        disabled: true,
        counter: 0
      }])
    }
  }
  const model = new ModelForFullUpdate({db, registry, name: 'name', schema: {
    tableName: 'some',
    enabled: 'boolean',
    disabled: 'boolean',
    counter: 'integer'
  }})

  model.update(12, {counter: 0})
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
        t.equal(
          sql,
          'INSERT INTO some (enabled, disabled, counter) VALUES (false, true, 0)',
          'sends sql-query to db layer'
        )
        this.sqlQueryCounter += 1
        return Promise.resolve(/* OK */)
      } else if (this.sqlQueryCounter === 1) {
        t.equal(
          sql,
          'SELECT id, enabled, disabled, counter FROM some WHERE enabled=false' +
          ' AND disabled=true AND counter=0',
          'sends sql-query to db layer'
        )
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

  class ModelForFullCreate extends BaseModel {}
  const model = new ModelForFullCreate({db, registry, name: 'name', schema: {
    tableName: 'some',
    enabled: 'boolean',
    disabled: 'boolean',
    counter: 'integer'
  }})

  model.create({
    enabled: false,
    disabled: true,
    counter: 0
  })
  .then((castData) => {
    t.pass('returns a Promise')
    t.deepEqual(castData, {
      id: '1',
      enabled: false,
      disabled: true,
      counter: 123
    })
  })
  .catch((e) => t.fail(`should not be called ${e}`))
  .then(() => t.end())
})

/**
 * belongsTo
 */
test('BaseModel#apiFetchAll calls selectMany() and returns serialized data', (t) => {
  t.plan(2)

  class ModelForFetchAll extends BaseModel {
    selectMany () {
      t.pass('selectMany() called')

      return Promise.resolve([
        {id: '1', name: 'Mathew', enabled: false},
        {id: '2', name: 'John', enabled: true}
      ])
    }
  }

  const model = new ModelForFetchAll({db: dbMock, registry, name: 'user', schema: {
    name: 'string',
    enabled: 'boolean'
  }})

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

test('BaseModel#apiFetchAll childModel can override selectMany() to provide own `options`', (t) => {
  t.plan(4)

  const db = {
    exec (sql) {
      t.pass('db.exec() called')
      t.equal(
        sql,
        'SELECT id, name, hide FROM sPersonal WHERE hide=false ORDER BY name',
        'sql query with regards to `options`'
      )
      return Promise.resolve([])
    }
  }

  class User extends BaseModel {
    selectMany () {
      t.pass('selectMany() called')

      const customOptionsForUser = {
        where: {hide: false},
        orderBy: 'name'
      }

      return super.selectMany(customOptionsForUser)
    }
  }

  const model = new User({db, registry, name: 'user', schema: {
    tableName: 'sPersonal',
    name: 'string',
    hide: 'boolean'
  }})

  model.apiFetchAll()
  .then(() => t.pass('success'))
  .catch(() => t.fail('should not be called'))
  .then(() => t.end())
})

test('BaseModel#_fetchRelations fetches relations data', (t) => {
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
          sqlBuilder: {
            schemaObject: {
              fullName: 'string'
            }
          }
        },

        userGroup: {
          selectMany () {
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

  class UserModel extends BaseModel {}
  const userModel = new UserModel({
    db: dbMock, registry: registryMock, name: 'user',
    schema: {
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
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
        group: {id: '101', shortName: 'Admins'},
        rights: {id: '12', fullName: 'Full'}
      },
      {
        id: '2', name: 'Smith',
        group: {id: '102', shortName: 'Users'},
        rights: {id: '13', fullName: 'Part'}
      }
    ])
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('BaseModel#apiFetchAll({withRelated: true}) returns serialized rows with relations data included', (t) => {
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
          sqlBuilder: {
            schemaObject: {
              fullName: 'string'
            }
          }
        },

        userGroup: {
          selectMany () {
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
        attributes: { shortName: 'Admins' },
        id: '101',
        type: 'groups'
      }, {
        attributes: { fullName: 'Full' },
        id: '12',
        type: 'rights'
      }, {
        attributes: { shortName: 'Users' },
        id: '102',
        type: 'groups'
      }, {
        attributes: { fullName: 'Part' },
        id: '13',
        type: 'rights'
      }]
    })
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('BaseModel#apiFetchAll({withRelated: false}) returns serialized rows without relations included', (t) => {
  t.plan(1)

  const registryMock = {
    model (modelName) {
      const _models = {
        rights: {
          sqlBuilder: {
            schemaObject: {
              /* doesn't matter here */
            }
          }
        },

        userGroup: {
          sqlBuilder: {
            schemaObject: {
              /* doesn't matter here */
            }
          }
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

test('BaseModel#_joinRelations with no "relations" provided changes relations ids into empty relations with ids', (t) => {
  t.plan(1)

  const registryMock = {
    model (modelName) {
      const schemas = {
        rights: { /* doesn't matter here */ },
        userGroup: { /* doesn't matter here */ }
      }

      return {
        name: modelName,
        sqlBuilder: {
          schemaObject: schemas[modelName]
        }
      }
    }
  }

  class UserModel extends BaseModel {}
  const userModel = new UserModel({
    db: dbMock, registry: registryMock, name: 'user',
    schema: {
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
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

  const registryMock = {
    model (modelName) {
      const schemas = {
        rights: { /* doesn't matter here */ },
        userGroup: { /* doesn't matter here */ }
      }

      return {
        name: modelName,
        sqlBuilder: {
          schemaObject: schemas[modelName]
        }
      }
    }
  }

  class UserModel extends BaseModel {}
  const userModel = new UserModel({
    db: dbMock, registry: registryMock, name: 'user',
    schema: {
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  })

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

test('BaseModel#_joinRelationsAndSerialize()', (t) => {
  const registryMock = {
    model (modelName) {
      const _schemas = {
        rights: { /* doesn't matter here */ },
        userGroup: { /* doesn't matter here */ }
      }

      return {
        name: modelName,
        sqlBuilder: {
          schemaObject: _schemas[modelName]
        }
      }
    }
  }

  class UserModel extends BaseModel {}
  const userModel = new UserModel({
    db: dbMock, registry: registryMock, name: 'user',
    schema: {
      name: 'string',
      userGroup: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  })

  const sqlRow = {
    id: '1', name: 'John',
    rightsId: '12',
    userGroupId: '101'
  }

  t.deepEqual(
    userModel._joinRelationsAndSerialize(sqlRow),
    {
      data: {
        attributes: { name: 'John' },
        id: '1',
        relationships: {
          userGroup: { data: { id: '101', type: 'userGroups' } },
          rights: { data: { id: '12', type: 'rights' } }
        },
        type: 'users'
      }
    }
  )

  t.end()
})

test('BaseModel#apiFind(id) calls selectOne() and serializes row without relations included', (t) => {
  t.plan(1)

  const registryMock = {
    model (modelName) {
      const _schemas = {
        rights: { /* doesn't matter here */ },
        userGroup: { /* doesn't matter here */ }
      }

      return {
        name: modelName,
        sqlBuilder: {
          schemaObject: _schemas[modelName]
        }
      }
    }
  }

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
    db: dbMock, registry: registryMock, name: 'user',
    schema: {
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
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

  const registryMock = {
    model (modelName) {
      const _schemas = {
        rights: { /* doesn't matter here */ },
        userGroup: { /* doesn't matter here */ }
      }

      return {
        name: modelName,
        sqlBuilder: {
          schemaObject: _schemas[modelName]
        }
      }
    }
  }

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
    db: dbMock, registry: registryMock, name: 'user',
    schema: {
      name: 'string',
      userGroup: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  })

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

  userModel.apiUpdate(1, updatesData)
  .then((updatedSerialized) => {
    t.deepEqual(updatedSerialized, {
      data: {
        attributes: { name: 'John' },
        id: '1',
        relationships: {
          userGroup: { data: { id: '101', type: 'userGroups' } },
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
  const userModel = new UserModel({db: dbMock, registry, name: 'user', schema: { name: 'string' }})

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
  const userModel = new UserModel({
    db: dbMock, registry, name: 'user', schema: { name: 'string' }
  })

  // overwrite deserializer for testing
  userModel.deserializer.deserialize = () => {
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

test.skip('BaseModel#apiCreate calls create() and returns saved serialized row without relations included', (t) => {
  t.plan(4)

  class GroupModel extends BaseModel {}
  const groupModel = new GroupModel({db: dbMock, registry, name: 'user-group', schema: { name: 'string' }})

  class RightsModel extends BaseModel {}
  const rightsModel = new RightsModel({db: dbMock, registry, name: 'rights', schema: { name: 'string' }})

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
  const userModel = new UserModel({db: dbMock, registry, name: 'user', schema: {
    name: 'string',
    userGroup: { belongsTo: groupModel },
    rights: { belongsTo: rightsModel }
  }})

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
  const userModel = new UserModel({db: dbMock, registry, name: 'user', schema: { name: 'string' }})

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

test.skip('BaseModel#apiCreate returns error from "deserialize"', (t) => {
  t.plan(2)

  class UserModel extends BaseModel {}
  const userModel = new UserModel({db: dbMock, registry, name: 'user', schema: { name: 'string' }})
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
