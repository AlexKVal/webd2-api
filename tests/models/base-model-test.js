'use strict'
const test = require('tape')

const BaseModel = require('../../lib/models/base-model')
const Schema = require('../../lib/sql-builder/Schema')

test('BaseModel is abstract class', (t) => {
  const fn1 = function fn1 () {
    return new BaseModel('name')
  }
  t.throws(fn1, /is abstract class/)

  class SomeModel extends BaseModel {}

  const fn2 = function fn2 () {
    return new SomeModel('name')
  }
  t.doesNotThrow(fn2, /is abstract class/)

  t.end()
})

test('BaseModel constructor gets name and optionally schema', (t) => {
  class SomeModel extends BaseModel {}

  const fn = function fn () {
    return new SomeModel()
  }
  t.throws(fn, /name is undefined/, 'throws when no "name" provided')
  t.end()
})

test('BaseModel if schema is not provided, then default one is created', (t) => {
  class SomeModel extends BaseModel {}
  const model = new SomeModel('some-name')

  t.equal(model.name, 'some-name')
  t.ok((model.schema instanceof Schema))
  t.end()
})

test('BaseModel throws if "schema" is not a conf obj or instance of Schema', (t) => {
  class SomeModel extends BaseModel {}

  const fn0 = function fn0 () {
    return new SomeModel('name', 'any non object')
  }
  t.throws(fn0, /schema attribute should be an instance of Schema/, 'throws with not an object')

  const fn1 = function fn1 () {
    return new SomeModel('name', {})
  }
  t.doesNotThrow(fn1, /schema attribute should be an instance of Schema/, 'does not throw with object')

  const fn2 = function fn2 () {
    return new SomeModel('name', new Schema({}))
  }
  t.doesNotThrow(fn2, /schema attribute should be an instance of Schema/, 'does not throw with Schema')
  t.end()
})
