'use strict'
const test = require('tape')

const Schema = require('../../lib/sql-builder/schema')
const SqlBuilder = require('../../lib/sql-builder/sql-builder')

test('sqlBuilder.columns holds only columns` descriptors', (t) => {
  const sqlBuilder = new SqlBuilder(new Schema({
    name: 'string',
    hide: 'boolean',
    group: {
      belongsTo: { name: 'user-group' }
    }
  }))

  t.equal(Object.keys(sqlBuilder.columns).length, 2)
  t.equal(sqlBuilder.columns.name, 'string')
  t.equal(sqlBuilder.columns.hide, 'boolean')
  t.end()
})

test('sqlBuilder.columnsNames holds columns` names', (t) => {
  const sqlBuilder = new SqlBuilder(new Schema({
    name: 'string',
    hide: 'boolean',
    group: {
      belongsTo: { name: 'user-group' }
    }
  }))

  t.equal(sqlBuilder.columnsNames.length, 2)
  t.equal(sqlBuilder.columnsNames[0], 'name')
  t.equal(sqlBuilder.columnsNames[1], 'hide')
  t.end()
})

test('sqlBuilder.generateUpdateSetPart() returns empty when Schema is empty', (t) => {
  const data = {
    name: 'some name',
    hide: false,
    someNumber: 33
  }

  const sqlBuilder = new SqlBuilder(new Schema({}))
  const setLines = sqlBuilder.generateUpdateSetPart(data)

  t.ok(Array.isArray(setLines), 'returns array')
  t.equal(setLines.length, 0, 'empty')
  t.end()
})

test('sqlBuilder.generateUpdateSetPart() handles properly "boolean" and "integer" types', (t) => {
  const data = {
    hide: false,
    someNumber: 33
  }
  const sqlBuilder = new SqlBuilder(new Schema({
    hide: 'boolean',
    someNumber: 'integer'
  }))

  const setLines = sqlBuilder.generateUpdateSetPart(data)

  t.equal(setLines.length, 2, 'returns two lines')
  t.equal(setLines[0], 'hide=false', 'for boolean')
  t.equal(setLines[1], 'someNumber=33', 'for integer')
  t.end()
})

test('sqlBuilder.generateUpdateSetPart(): strings are escaped and single-quoted', (t) => {
  const data = {
    name: 'some name',
    quetedString: 'input with \'quotes\''
  }
  const sqlBuilder = new SqlBuilder(new Schema({
    name: 'string',
    quetedString: 'string'
  }))

  const setLines = sqlBuilder.generateUpdateSetPart(data)

  t.equal(setLines.length, 2, 'returns two lines')
  t.equal(setLines[0], "name='some name'", 'string w/o quotes')
  t.equal(setLines[1], "quetedString='input with  quotes '", 'string w/ quotes')
  t.end()
})

test('sqlBuilder.generateUpdateSetPart(): "null" and "undefined" => empty string', (t) => {
  const data = {
    nullString: null,
    undefinedString: undefined
  }
  const sqlBuilder = new SqlBuilder(new Schema({
    nullString: 'string',
    undefinedString: 'string'
  }))

  const setLines = sqlBuilder.generateUpdateSetPart(data)

  t.equal(setLines.length, 2, 'returns two lines')
  t.equal(setLines[0], "nullString=''", 'null')
  t.equal(setLines[1], "undefinedString=''", 'undefined')
  t.end()
})

test('sqlBuilder.generateUpdateSetPart(): other data types are converted to strings', (t) => {
  const data = {
    shouldBeString: 123,
    shouldBeString2: false
  }
  const sqlBuilder = new SqlBuilder(new Schema({
    shouldBeString: 'string',
    shouldBeString2: 'string'
  }))

  const setLines = sqlBuilder.generateUpdateSetPart(data)

  t.equal(setLines.length, 2, 'returns two lines')
  t.equal(setLines[0], "shouldBeString='123'", 'number')
  t.equal(setLines[1], "shouldBeString2='false'", 'boolean')
  t.end()
})

test('sqlBuilder._generateForeignKeysLines', (t) => {
  const sqlBuilder = new SqlBuilder(new Schema({
    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' },
      fkField: 'rights'
    }
  }))

  const lines = sqlBuilder._generateForeignKeysLines()
  t.equal(lines.length, 2)
  t.equal(lines[0], 'GrpID as userGroupId')
  t.equal(lines[1], 'rights as rightsId')
  t.end()
})

test('sqlBuilder.generateSelectFieldsPart with a default "id" field', (t) => {
  const sqlBuilder = new SqlBuilder(new Schema({
    name: 'string',
    cardcode: 'string',
    hide: 'boolean',
    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' },
      fkField: 'rights'
    }
  }))

  const fields = sqlBuilder.generateSelectFieldsPart()
  t.equal(fields, 'id, name, cardcode, hide, GrpID as userGroupId, rights as rightsId')
  t.end()
})

test('sqlBuilder.generateSelectFieldsPart with a custom "id" field', (t) => {
  const sqlBuilder = new SqlBuilder(new Schema({
    id: 'UserID',
    name: 'string',
    hide: 'boolean',
    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    }
  }))

  const fields = sqlBuilder.generateSelectFieldsPart()
  t.equal(fields, 'UserID as id, name, hide, GrpID as userGroupId')
  t.end()
})

test('sqlBuilder.getIdFieldLine() with a default "id" field', (t) => {
  const sqlBuilder = new SqlBuilder(new Schema({
    name: 'string'
  }))

  t.equal(sqlBuilder.getIdFieldLine(), 'id')
  t.end()
})

test('sqlBuilder.getIdFieldLine() with a custom "id" field', (t) => {
  const sqlBuilder = new SqlBuilder(new Schema({
    id: 'UserID',
    name: 'string'
  }))

  t.equal(sqlBuilder.getIdFieldLine(), 'UserID as id')
  t.end()
})
