'use strict'
const test = require('tape')

const {
  generateUpdateSetPart
} = require('../../lib/sql-builder/sql-generators')
const Schema = require('../../lib/sql-builder/schema')

test('generateUpdateSetPart returns empty array with empty schema', (t) => {
  const data = {
    name: 'some name',
    hide: false,
    someNumber: 33
  }
  const schema = new Schema({})

  const setLines = generateUpdateSetPart(data, schema)

  t.ok(Array.isArray(setLines), 'returns array')
  t.equal(setLines.length, 0, 'returns empty array')
  t.end()
})

test('generateUpdateSetPart: "boolean" and "integer" types', (t) => {
  const data = {
    hide: false,
    someNumber: 33
  }
  const schema = new Schema({
    hide: 'boolean',
    someNumber: 'integer'
  })

  const setLines = generateUpdateSetPart(data, schema)

  t.equal(setLines.length, 2, 'returns two lines')
  t.equal(setLines[0], 'hide=false', 'for boolean')
  t.equal(setLines[1], 'someNumber=33', 'for integer')
  t.end()
})

test('generateUpdateSetPart: strings are escaped and single-quoted', (t) => {
  const data = {
    name: 'some name',
    quetedString: 'input with \'quotes\''
  }
  const schema = new Schema({
    name: 'string',
    quetedString: 'string'
  })

  const setLines = generateUpdateSetPart(data, schema)

  t.equal(setLines.length, 2, 'returns two lines')
  t.equal(setLines[0], "name='some name'", 'string w/o quotes')
  t.equal(setLines[1], "quetedString='input with  quotes '", 'string w/ quotes')
  t.end()
})

test('generateUpdateSetPart: null and undefined are converted to empty string', (t) => {
  const data = {
    nullString: null,
    undefinedString: undefined
  }
  const schema = new Schema({
    nullString: 'string',
    undefinedString: 'string'
  })

  const setLines = generateUpdateSetPart(data, schema)

  t.equal(setLines.length, 2, 'returns two lines')
  t.equal(setLines[0], "nullString=''", 'null')
  t.equal(setLines[1], "undefinedString=''", 'undefined')
  t.end()
})

test('generateUpdateSetPart: other data types are converted to strings', (t) => {
  const data = {
    shouldBeString: 123,
    shouldBeString2: false
  }
  const schema = new Schema({
    shouldBeString: 'string',
    shouldBeString2: 'string'
  })

  const setLines = generateUpdateSetPart(data, schema)

  t.equal(setLines.length, 2, 'returns two lines')
  t.equal(setLines[0], "shouldBeString='123'", 'number')
  t.equal(setLines[1], "shouldBeString2='false'", 'boolean')
  t.end()
})
