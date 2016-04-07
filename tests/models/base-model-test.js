'use strict'
const test = require('tape')

const BaseModel = require('../../lib/models/base-model')
const Schema = require('../../lib/sql-builder/Schema')

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
  t.ok((model.schema instanceof Schema))
  t.end()
})

test('BaseModel throws if "schema" is not a conf obj or instance of Schema', (t) => {
  const fn0 = function fn0 () {
    return new SomeModel(dbMock, 'name', 'any non object')
  }
  t.throws(fn0, /schema attribute should be an instance of Schema/, 'throws with not an object')

  const fn1 = function fn1 () {
    return new SomeModel(dbMock, 'name', {})
  }
  t.doesNotThrow(fn1, /schema attribute should be an instance of Schema/, 'does not throw with object')

  const fn2 = function fn2 () {
    return new SomeModel(dbMock, 'name', new Schema({}))
  }
  t.doesNotThrow(fn2, /schema attribute should be an instance of Schema/, 'does not throw with Schema')
  t.end()
})

/**
 * #all
 */
class ModelForAll extends BaseModel {
  sqlAll () {}
}

test('BaseModel#all returns Promise', (t) => {
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

test('BaseModel#all catches db-layer error message and returns it as Error object', (t) => {
  t.plan(3)

  const db = {
    exec () {
      t.pass('db#exec call')
      return Promise.reject(new Error('db error message'))
    }
  }

  const model = new ModelForAll(db, 'name', {})
  model.all()
  .catch((e) => {
    t.pass('catch db error')
    t.assert(/db error message/.test(e.message), 'assert error message')
    t.end()
  })
})

test('BaseModel#all throws error if sqlAll is not overriden', (t) => {
  const db = {
    exec () { return Promise.resolve() }
  }

  class ModelAllThrows extends BaseModel {}
  const model = new ModelAllThrows(db, 'name', {})
  t.throws(() => model.all())
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
