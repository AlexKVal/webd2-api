'use strict'
const test = require('tape')

const SqlBuilder = require('../../lib/sql-builder/sql-builder')

test('sqlBuilder.columns holds only columns` descriptors', (t) => {
  const sqlBuilder = new SqlBuilder({
    name: 'string',
    hide: 'boolean',
    group: {
      belongsTo: { name: 'user-group' }
    }
  })

  t.equal(Object.keys(sqlBuilder.columns).length, 2)
  t.equal(sqlBuilder.columns.name, 'string')
  t.equal(sqlBuilder.columns.hide, 'boolean')
  t.end()
})

test('sqlBuilder.columnsNames holds columns` names', (t) => {
  const sqlBuilder = new SqlBuilder({
    name: 'string',
    hide: 'boolean',
    group: {
      belongsTo: { name: 'user-group' }
    }
  })

  t.equal(sqlBuilder.columnsNames.length, 2)
  t.equal(sqlBuilder.columnsNames[0], 'name')
  t.equal(sqlBuilder.columnsNames[1], 'hide')
  t.end()
})

test('sqlBuilder.generateUpdateSetPart() returns empty', (t) => {
  const data = {
    name: 'some name',
    hide: false,
    someNumber: 33
  }

  const sqlBuilder = new SqlBuilder({})
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
  const sqlBuilder = new SqlBuilder({
    hide: 'boolean',
    someNumber: 'integer'
  })

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
  const sqlBuilder = new SqlBuilder({
    name: 'string',
    quetedString: 'string'
  })

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
  const sqlBuilder = new SqlBuilder({
    nullString: 'string',
    undefinedString: 'string'
  })

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
  const sqlBuilder = new SqlBuilder({
    shouldBeString: 'string',
    shouldBeString2: 'string'
  })

  const setLines = sqlBuilder.generateUpdateSetPart(data)

  t.equal(setLines.length, 2, 'returns two lines')
  t.equal(setLines[0], "shouldBeString='123'", 'number')
  t.equal(setLines[1], "shouldBeString2='false'", 'boolean')
  t.end()
})

test('sqlBuilder._getRelations()', (t) => {
  const sqlBuilder = new SqlBuilder({
    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    },
    posts: {
      belongsTo: { name: 'user-post' }
    }
  })

  const lines = sqlBuilder._getRelations()
  t.equal(lines.length, 3)
  t.deepEqual(lines[0], {fkField: 'GrpID', fkAs: 'userGroupId'})
  t.deepEqual(lines[1], {fkField: 'rights', fkAs: 'rightsId'}, 'uses foreign table name if no fkField provided')
  t.deepEqual(lines[2], {fkField: 'userPost', fkAs: 'userPostId'}, 'uses camelCased foreign table name')
  t.end()
})

test('sqlBuilder._generateForeignKeysLines()', (t) => {
  const sqlBuilder = new SqlBuilder({
    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    },
    posts: {
      belongsTo: { name: 'user-post' }
    }
  })

  const lines = sqlBuilder._generateForeignKeysLines()
  t.equal(lines.length, 3)
  t.equal(lines[0], 'GrpID as userGroupId')
  t.equal(lines[1], 'rights as rightsId', 'uses foreign table name if no fkField provided')
  t.equal(lines[2], 'userPost as userPostId', 'uses camelCased foreign table name')
  t.end()
})

test('sqlBuilder.generateSelectFieldsPart with a default "id" field', (t) => {
  const sqlBuilder = new SqlBuilder({
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
  })

  const fields = sqlBuilder.generateSelectFieldsPart()
  t.equal(fields, 'id, name, cardcode, hide, GrpID as userGroupId, rights as rightsId')
  t.end()
})

test('sqlBuilder.generateSelectFieldsPart with a custom "id" field', (t) => {
  const sqlBuilder = new SqlBuilder({
    id: 'UserID',
    name: 'string',
    hide: 'boolean',
    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    }
  })

  const fields = sqlBuilder.generateSelectFieldsPart()
  t.equal(fields, 'UserID as id, name, hide, GrpID as userGroupId')
  t.end()
})

test('sqlBuilder.getIdFieldLine() with a default "id" field', (t) => {
  const sqlBuilder = new SqlBuilder({
    name: 'string'
  })

  t.equal(sqlBuilder.getIdFieldLine(), 'id')
  t.end()
})

test('sqlBuilder.getIdFieldLine() with a custom "id" field', (t) => {
  const sqlBuilder = new SqlBuilder({
    id: 'UserID',
    name: 'string'
  })

  t.equal(sqlBuilder.getIdFieldLine(), 'UserID as id')
  t.end()
})

test('sqlBuilder.getIdFieldName() with a custom "id" field', (t) => {
  const sqlBuilder = new SqlBuilder({
    id: 'UserID',
    name: 'string'
  })

  t.equal(sqlBuilder.getIdFieldName(), 'UserID')
  t.end()
})

test('sqlBuilder.getIdFieldName() with a default "id" field', (t) => {
  const sqlBuilder = new SqlBuilder({
    name: 'string'
  })

  t.equal(sqlBuilder.getIdFieldName(), 'id')
  t.end()
})

test('sqlBuilder.getTableName() throws if no tableName provided', (t) => {
  const sqlBuilder = new SqlBuilder({
    /* tableName: 'is not provided', */
    name: 'string'
  })

  const fn0 = function () {
    sqlBuilder.getTableName()
  }

  t.throws(fn0, /tableName is not provided/)
  t.end()
})

test('sqlBuilder.getTableName() returns tableName', (t) => {
  const sqlBuilder = new SqlBuilder({
    tableName: 'whatever',
    name: 'string'
  })

  t.equal(sqlBuilder.getTableName(), 'whatever')
  t.end()
})

test('sqlBuilder.descriptors contains all fields but "tableName" and "id"', (t) => {
  const sqlBuilder = new SqlBuilder({
    tableName: 'whatever',
    id: 'customId',
    name: 'string',
    boolFlag: 'boolean',
    someNumber: 'integer'
  })

  t.equal(Object.keys(sqlBuilder.descriptors).length, 3)
  t.deepEqual(sqlBuilder.descriptors, {
    name: 'string',
    boolFlag: 'boolean',
    someNumber: 'integer'
  })
  t.end()
})

test('sqlBuilder.tableName', (t) => {
  const sqlBuilder1 = new SqlBuilder({ tableName: 'whatever' })
  t.equal(sqlBuilder1.tableName, 'whatever')

  const sqlBuilder2 = new SqlBuilder({})
  t.equal(sqlBuilder2.tableName, undefined)
  t.end()
})

test('sqlBuilder.id', (t) => {
  const sqlBuilder1 = new SqlBuilder({ id: 'whatever' })
  t.equal(sqlBuilder1.id, 'whatever')

  const sqlBuilder2 = new SqlBuilder({})
  t.equal(sqlBuilder2.id, undefined)
  t.end()
})

const sqlBuilderForSql = new SqlBuilder({
  tableName: 'sPersonal',
  id: 'PersID',
  name: 'string',
  hide: 'boolean',
  groups: {
    belongsTo: { name: 'user-group' },
    fkField: 'GrpID'
  },
  rights: {
    belongsTo: { name: 'rights' }
  }
})

test('sqlBuilder.sqlAll() returns sql query for fetching all rows', (t) => {
  t.equal(
    sqlBuilderForSql.sqlAll(),
    'SELECT PersID as id, name, hide, GrpID as userGroupId, rights as rightsId' +
    ' FROM sPersonal'
  )
  t.end()
})

test('sqlBuilder.sqlOne(id) returns sql query for fetching particular row by "id"', (t) => {
  t.equal(
    sqlBuilderForSql.sqlOne(11),
    'SELECT PersID as id, name, hide, GrpID as userGroupId, rights as rightsId' +
    ' FROM sPersonal WHERE PersID=11'
  )
  t.end()
})

test('sqlBuilder.sqlIsRowExist(id) returns sql query for checking row existence by "id"', (t) => {
  t.equal(
    sqlBuilderForSql.sqlIsRowExist(202),
    'SELECT PersID as id FROM sPersonal WHERE PersID=202'
  )
  t.end()
})
