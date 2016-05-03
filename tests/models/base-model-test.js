'use strict'
const test = require('tape')

const BaseModel = require('../../lib/models/base-model')

const dbMock = { exec () { return Promise.resolve() } }
const registry = {
  model () { return { sqlBuilder: { schemaObject: { /* doesn't matter */ } } } }
}

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
