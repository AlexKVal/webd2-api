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

test('sqlBuilder.generateUpdateFieldsPart() returns empty', (t) => {
  const data = {
    name: 'some name',
    hide: false,
    someNumber: 33
  }

  const sqlBuilder = new SqlBuilder({})
  const setLines = sqlBuilder.generateUpdateFieldsPart(data)

  t.equal(setLines, '', 'empty')
  t.end()
})

test('sqlBuilder.generateUpdateFieldsPart() handles properly "boolean" and "integer" types', (t) => {
  const data = {
    hide: false,
    someNumber: 33
  }
  const sqlBuilder = new SqlBuilder({
    hide: 'boolean',
    someNumber: 'integer'
  })

  t.equal(sqlBuilder.generateUpdateFieldsPart(data), 'hide=false, someNumber=33')
  t.end()
})

test('sqlBuilder.generateUpdateFieldsPart(): strings are escaped and single-quoted', (t) => {
  const data = {
    name: 'some name',
    quetedString: 'input with \'quotes\''
  }
  const sqlBuilder = new SqlBuilder({
    name: 'string',
    quetedString: 'string'
  })

  t.equal(
    sqlBuilder.generateUpdateFieldsPart(data),
    "name='some name', quetedString='input with  quotes '"
  )
  t.end()
})

test('sqlBuilder.generateUpdateFieldsPart(): "null" and "undefined" => empty string', (t) => {
  const data = {
    nullString: null,
    undefinedString: undefined
  }
  const sqlBuilder = new SqlBuilder({
    nullString: 'string',
    undefinedString: 'string'
  })

  t.equal(
    sqlBuilder.generateUpdateFieldsPart(data),
    "nullString='', undefinedString=''"
  )
  t.end()
})

test('sqlBuilder.generateUpdateFieldsPart(): other data types are converted to strings', (t) => {
  const data = {
    shouldBeString: 123,
    shouldBeString2: false
  }
  const sqlBuilder = new SqlBuilder({
    shouldBeString: 'string',
    shouldBeString2: 'string'
  })

  t.equal(
    sqlBuilder.generateUpdateFieldsPart(data),
    "shouldBeString='123', shouldBeString2='false'"
  )
  t.end()
})

test('sqlBuilder.generateUpdateFieldsPart(): relations lines too', (t) => {
  const sqlBuilder = new SqlBuilder({
    name: 'string',
    hide: 'boolean',
    userGroup: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    }
  })

  const data = {
    name: 'some',
    hide: false,
    userGroup: {id: '13'},
    rights: {id: '101'}
  }

  t.equal(
    sqlBuilder.generateUpdateFieldsPart(data),
    "name='some', hide=false, GrpID=13, rights=101"
  )
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
    post: {
      belongsTo: { name: 'user-post' }
    }
  })

  const lines = sqlBuilder._getRelations()
  t.equal(lines.length, 3)
  t.deepEqual(lines[0], {fkField: 'GrpID', fkAs: 'userGroupId', modelFieldName: 'group'})
  t.deepEqual(
    lines[1],
    {fkField: 'rights', fkAs: 'rightsId', modelFieldName: 'rights'},
    'uses foreign table name if no fkField provided'
  )
  t.deepEqual(
    lines[2],
    {fkField: 'userPost', fkAs: 'userPostId', modelFieldName: 'post'},
    'uses camelCased foreign table name'
  )
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

test('sqlBuilder._getRelationsLinesForUpdate()', (t) => {
  const sqlBuilder = new SqlBuilder({
    userGroup: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    }
  })

  const data = {
    name: 'some',
    hide: false,
    userGroup: {id: '13'},
    rights: {id: '101'}
  }

  const relationsLines = sqlBuilder._getRelationsLinesForUpdate(data)
  t.equal(relationsLines.length, 2)
  t.deepEqual(relationsLines, [
    'GrpID=13',
    'rights=101'
  ])
  t.end()
})
