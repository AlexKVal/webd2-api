'use strict'
const test = require('tape')

const SqlBuilder = require('../../lib/sql-builder/sql-builder')
const quoteValueIfString = SqlBuilder.quoteValueIfString

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

test('sqlBuilder.generateFieldEqualsDataLines() with full data', (t) => {
  const sqlBuilder = new SqlBuilder({
    hide: 'boolean',
    someNumber: 'integer',
    name: 'string',
    quotedString: 'string',
    shouldBeString: 'string',
    shouldBeString2: 'string',

    userGroup: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    }
  })

  const fullData = {
    hide: false,
    someNumber: 33,
    name: 'some name',
    quotedString: 'input with \'quotes\'',
    shouldBeString: 123,
    shouldBeString2: false,

    userGroup: {id: '13'},
    rights: {id: '101'}
  }

  const lines = sqlBuilder.generateFieldEqualsDataLines(fullData)
  t.equal(lines[0], 'hide=false', 'boolean values')
  t.equal(lines[1], 'someNumber=33', 'integer values')
  t.equal(lines[2], "name='some name'", 'quotes strings')
  t.equal(lines[3], "quotedString='input with  quotes '", 'strips single quotes off strings')
  t.equal(lines[4], "shouldBeString='123'", 'quotes as string other data types')
  t.equal(lines[5], "shouldBeString2='false'", 'quotes as string other data types')

  t.equal(lines[6], 'GrpID=13', 'handles relations too')
  t.equal(lines[7], 'rights=101', 'handles relations too')

  const emptySqlBuilder = new SqlBuilder({})
  const emptyLines = emptySqlBuilder.generateFieldEqualsDataLines(fullData)

  t.ok(Array.isArray(emptyLines))
  t.equal(emptyLines.length, 0, 'empty result with empty schema')

  t.end()
})

test('sqlBuilder.generateFieldEqualsDataLines() with partial data', (t) => {
  const sqlBuilder = new SqlBuilder({
    hide: 'boolean',
    someNumber: 'integer',
    name: 'string',
    quotedString: 'string',
    shouldBeString: 'string',
    shouldBeString2: 'string',

    userGroup: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    }
  })

  const partialData = {
    shouldBeString: 123,
    hide: false,
    rights: {id: '101'},
    quotedString: 'input with \'quotes\''
  }

  const partialDataLines = sqlBuilder.generateFieldEqualsDataLines(partialData)
  t.deepEqual(partialDataLines, [
    'hide=false',
    "quotedString='input with  quotes '",
    "shouldBeString='123'",
    'rights=101'
  ])

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

test('sqlBuilder._getRelationsLinesForUpdate() with full data', (t) => {
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
  t.deepEqual(relationsLines, [
    'GrpID=13',
    'rights=101'
  ])
  t.end()
})

test('sqlBuilder._getRelationsLinesForUpdate() with partial data', (t) => {
  const sqlBuilder = new SqlBuilder({
    userGroup: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    },
    post: {
      belongsTo: { name: 'user-post' },
      fkField: 'PostID'
    }
  })

  const data = {
    post: {id: '2'},
    name: 'some',
    userGroup: {id: '13'}
  }

  const relationsLines = sqlBuilder._getRelationsLinesForUpdate(data)
  t.deepEqual(relationsLines, [ 'GrpID=13', 'PostID=2' ])
  t.end()
})

test('sqlBuilder.sqlUpdate(id, data) returns sql query for updating row', (t) => {
  const sqlBuilder = new SqlBuilder({
    tableName: 'sPersonal',
    id: 'PersID',

    name: 'string',
    hide: 'boolean',
    counter: 'integer',

    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    },
    post: {
      belongsTo: { name: 'post' },
      fkField: 'PostID'
    }
  })

  const updateData = {
    id: '33',
    name: 'new one',
    hide: false,
    counter: '445',
    group: {id: '12'},
    rights: {id: '101'},
    post: {id: '23'}
  }

  t.equal(
    sqlBuilder.sqlUpdate('33', updateData),
    'UPDATE sPersonal' +
    " SET name='new one', hide=false, counter=445, GrpID=12, rights=101, PostID=23" +
    ' WHERE PersID=33'
  )
  t.end()
})

test('sqlBuilder.sqlUpdate(id, data) can generate sql query with partial data', (t) => {
  const sqlBuilder = new SqlBuilder({
    tableName: 'sPersonal',
    id: 'PersID',

    name: 'string',
    hide: 'boolean',
    counter: 'integer',

    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    },
    post: {
      belongsTo: { name: 'post' },
      fkField: 'PostID'
    }
  })

  const partialUpdateData = {
    id: '33',
    hide: false,
    rights: {id: '101'}
  }

  t.equal(
    sqlBuilder.sqlUpdate('33', partialUpdateData),
    'UPDATE sPersonal' +
    ' SET hide=false, rights=101' +
    ' WHERE PersID=33',
    'query for partial update'
  )
  t.end()
})

test('sqlBuilder.sqlOneByData(data) returns sql query for retrieving ID for row', (t) => {
  const sqlBuilder = new SqlBuilder({
    tableName: 'sPersonal',
    id: 'PersID',

    name: 'string',
    hide: 'boolean',
    counter: 'integer',

    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    },
    post: {
      belongsTo: { name: 'post' },
      fkField: 'PostID'
    }
  })

  const newData = {
    /* no id because the row is just INSERTed and we want to know it's new ID */
    name: 'new one',
    hide: false,
    counter: '445',
    group: {id: '12'},
    rights: {id: '101'},
    post: {id: '23'}
  }

  t.equal(
    sqlBuilder.sqlOneByData(newData),
    'SELECT PersID as id, name, hide, counter, GrpID as userGroupId, rights as rightsId, PostID as postId' +
    ' FROM sPersonal' +
    " WHERE name='new one' AND hide=false AND counter=445 AND GrpID=12 AND rights=101 AND PostID=23"
  )
  t.end()
})

test('sqlBuilder._fieldsNamesForInsert(data) only names that are present in data and schema', (t) => {
  const sqlBuilder = new SqlBuilder({
    tableName: 'sPersonal',
    id: 'PersID',

    name: 'string',
    hide: 'boolean',
    counter: 'integer',

    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    },
    post: {
      belongsTo: { name: 'post' },
      fkField: 'PostID'
    }
  })

  const fullData = {
    /* no id because the row is new */
    name: 'new one',
    hide: false,
    counter: '445',
    group: {id: '12'},
    rights: {id: '101'},
    post: {id: '23'}
  }

  t.deepEqual(
    sqlBuilder._fieldsNamesForInsert(fullData),
    ['name', 'hide', 'counter', 'GrpID', 'rights', 'PostID'],
    'full data'
  )

  const partialData = {
    /* no id because the row is new */
    name: 'new one',
    group: {id: '12'},
    post: {id: '23'}
  }

  t.deepEqual(
    sqlBuilder._fieldsNamesForInsert(partialData),
    ['name', 'GrpID', 'PostID'],
    'partial data'
  )

  const extraDataFields = {
    /* no id because the row is new */
    name: 'new one',
    extraField1: 'extra-data',
    hide: false,
    counter: '445',
    group: {id: '12'},
    rights: {id: '101'},
    post: {id: '23'},
    extraField2: 'extra-data'
  }

  t.deepEqual(
    sqlBuilder._fieldsNamesForInsert(extraDataFields),
    ['name', 'hide', 'counter', 'GrpID', 'rights', 'PostID'],
    'extra data fields got cut'
  )
  t.end()
})

test('quoteValueIfString() returns as is "boolean" and "integer" types', (t) => {
  t.equal(quoteValueIfString('boolean', false), false)
  t.equal(quoteValueIfString('integer', 3), 3)
  t.end()
})

test('quoteValueIfString() strings are escaped and single-quoted', (t) => {
  t.equal(quoteValueIfString('string', 'some name'), "'some name'")
  t.equal(quoteValueIfString('string', 'input with \'quotes\''), "'input with  quotes '")
  t.end()
})

test('quoteValueIfString() other data types are converted to strings', (t) => {
  t.equal(quoteValueIfString('string', 123), "'123'")
  t.equal(quoteValueIfString('string', false), "'false'")
  t.end()
})

test('quoteValueIfString() throws if value is "null" or "undefined"', (t) => {
  const fn0 = function () {
    quoteValueIfString('string', null)
  }

  const fn1 = function () {
    quoteValueIfString('string', undefined)
  }

  t.throws(fn0, /value for SQL query cannot be null or undefined/)
  t.throws(fn1, /value for SQL query cannot be null or undefined/)
  t.end()
})

test('sqlBuilder._fieldsValuesForInsert(data)', (t) => {
  const sqlBuilder = new SqlBuilder({
    tableName: 'sPersonal',
    id: 'PersID',

    name: 'string',
    hide: 'boolean',
    counter: 'integer',

    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    },
    post: {
      belongsTo: { name: 'post' },
      fkField: 'PostID'
    }
  })

  const fullData = {
    /* no id because the row is new */
    name: 'new one',
    hide: false,
    counter: 445,
    group: {id: '12'},
    rights: {id: '101'},
    post: {id: '23'}
  }

  t.deepEqual(
    sqlBuilder._fieldsValuesForInsert(fullData),
    ["'new one'", false, 445, '12', '101', '23'],
    'full data'
  )

  const partialData = {
    /* no id because the row is new */
    name: 'new one',
    group: {id: '12'},
    post: {id: '23'}
  }

  t.deepEqual(
    sqlBuilder._fieldsValuesForInsert(partialData),
    ["'new one'", '12', '23'],
    'partial data'
  )

  const extraDataFields = {
    /* no id because the row is new */
    name: 'new one',
    extraField1: 'extra-data',
    hide: false,
    counter: 445,
    group: {id: '12'},
    rights: {id: '101'},
    post: {id: '23'},
    extraField2: 'extra-data'
  }

  t.deepEqual(
    sqlBuilder._fieldsValuesForInsert(extraDataFields),
    ["'new one'", false, 445, '12', '101', '23'],
    'extra data fields got cut'
  )

  t.end()
})

test('sqlBuilder.sqlCreate(data) returns sql query for INSERT-ing new row', (t) => {
  const sqlBuilder = new SqlBuilder({
    tableName: 'sPersonal',
    id: 'PersID',

    name: 'string',
    hide: 'boolean',
    counter: 'integer',

    group: {
      belongsTo: { name: 'user-group' },
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: { name: 'rights' }
    },
    post: {
      belongsTo: { name: 'post' },
      fkField: 'PostID'
    }
  })

  const fullData = {
    /* no id because the row is new */
    name: 'new one',
    hide: false,
    counter: '445',
    group: {id: '12'},
    rights: {id: '101'},
    post: {id: '23'}
  }

  t.equal(
    sqlBuilder.sqlCreate(fullData),
    'INSERT INTO sPersonal' +
    ' (name, hide, counter, GrpID, rights, PostID)' +
    " VALUES ('new one', false, 445, 12, 101, 23)",
    'generates INSERT with all data fields provided',
    'full data'
  )

  const partialData = {
    /* no id because the row is new */
    name: 'new one',
    group: {id: '12'},
    post: {id: '23'}
  }

  t.deepEqual(
    sqlBuilder.sqlCreate(partialData),
    'INSERT INTO sPersonal' +
    ' (name, GrpID, PostID)' +
    " VALUES ('new one', 12, 23)",
    'generates INSERT with all data fields provided',
    'partial data'
  )

  const extraDataFields = {
    /* no id because the row is new */
    name: 'new one',
    extraField1: 'extra-data',
    hide: false,
    counter: '445',
    group: {id: '12'},
    rights: {id: '101'},
    post: {id: '23'},
    extraField2: 'extra-data'
  }

  t.deepEqual(
    sqlBuilder.sqlCreate(extraDataFields),
    'INSERT INTO sPersonal' +
    ' (name, hide, counter, GrpID, rights, PostID)' +
    " VALUES ('new one', false, 445, 12, 101, 23)",
    'generates INSERT with all data fields provided',
    'extra data fields got cut'
  )

  t.end()
})
