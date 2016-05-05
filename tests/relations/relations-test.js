'use strict'
const test = require('tape')

const Relations = require('../../lib/relations/relations')

test('Relations', (t) => {
  t.throws(
    () => new Relations(/* no modelName */),
    /modelName is undefined/
  )

  t.throws(
    () => new Relations('user' /* no modelSchema */),
    /modelSchema is undefined/
  )

  t.throws(
    () => new Relations('user', 'modelSchema is not an object'),
    /modelSchema should be an object/
  )

  t.throws(
    () => new Relations('user', {/* tableName is undefined */}),
    /modelSchema tableName is undefined/
  )

  const model = {
    name: 'userGroup',
    schema: {
      tableName: 'sPepTree',
      name: 'string',
      hide: 'boolean',
      users: {
        hasMany: 'user',
        fkField: 'GrpID'
      }
    }
  }

  const userRelations = new Relations(model.name, model.schema)

  t.equal(userRelations.modelName, 'userGroup')
  t.equal(userRelations.modelSchema, model.schema)
  // TODO t.equal(userRelations.attributesToSerialize, [''])

  t.end()
})

test('relations._embedHasMany()', (t) => {
  const model = {
    name: 'userGroup',
    schema: {
      tableName: 'sPepTree',
      name: 'string',
      hide: 'boolean',
      users: {
        hasMany: 'user',
        fkField: 'GrpID'
      }
    }
  }

  const relationsData = [
    {
      modelFieldName: 'users',
      parentModelFieldName: 'group',
      rows: [
        { id: '101', name: 'John', cardcode: '123', hide: false, userGroupId: '1' },
        { id: '102', name: 'Simona', cardcode: '455', hide: false, userGroupId: '1' },
        { id: '103', name: 'Whatson', cardcode: '', hide: false, userGroupId: '2' },
        { id: '104', name: 'Vaschev', cardcode: '9022', hide: false, userGroupId: '2' }
      ]
    }
  ]

  const parentRows = [
    {id: '1', name: 'Bartenders', hide: false},
    {id: '2', name: 'Waiters', hide: false}
  ]

  const userRelations = new Relations(model.name, model.schema)

  t.deepEqual(
    userRelations._embedHasMany(parentRows, relationsData),
    [
      {
        id: '1', name: 'Bartenders', hide: false,
        users: [
          { id: '101', name: 'John', cardcode: '123', hide: false, group: {id: '1'} },
          { id: '102', name: 'Simona', cardcode: '455', hide: false, group: {id: '1'} }
        ]
      },
      {
        id: '2', name: 'Waiters', hide: false,
        users: [
          { id: '103', name: 'Whatson', cardcode: '', hide: false, group: {id: '2'} },
          { id: '104', name: 'Vaschev', cardcode: '9022', hide: false, group: {id: '2'} }
        ]
      }
    ],
    'joins in hasMany relations data'
  )

  t.end()
})

test('relations._embedBelongsTo() with no relationsData provided', (t) => {
  const model = {
    name: 'user',
    schema: {
      tableName: 'sPepTree',
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  }

  const parentRows = [
    {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
    {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
  ]

  const userRelations = new Relations(model.name, model.schema)

  t.deepEqual(
    userRelations._embedBelongsTo(parentRows /* no relationsData */),
    [
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
    ],
    'just embeds empty belongsTo relations instead of beongsTo-fkAs`'
  )

  t.end()
})

test('relations._embedBelongsTo() with relations data provided', (t) => {
  const model = {
    name: 'user',
    schema: {
      tableName: 'sPepTree',
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  }

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

  const userRelations = new Relations(model.name, model.schema)

  t.deepEqual(
    userRelations._embedBelongsTo(parentRows, relationsData),
    [
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
    ],
    'embeds relations data'
  )

  t.end()
})

test('Relations: findModelFieldName(modelName, relModelSchema)', (t) => {
  const relationModelSchema = {
    tableName: 'table-name',
    group: {
      belongsTo: 'userGroup'
    },
    rights: {
      belongsTo: 'userRights'
    },
    tables: {
      hasMany: 'table'
    }
  }

  const findModelFieldName = Relations.findModelFieldName

  t.equal(findModelFieldName('userRights', relationModelSchema), 'rights')
  t.equal(findModelFieldName('userGroup', relationModelSchema), 'group')
  t.throws(
    () => findModelFieldName('table', relationModelSchema),
    /there is no belongsTo descriptor for 'table'/,
    'throws if attempted to get undescribed belongsTo model'
  )
  t.end()
})

test('relations._fetchHasMany()', (t) => {
  t.plan(3)

  const registryMock = {
    _models: {
      user: {
        schema: {
          id: 'PersID',
          tableName: 'sPersonal',
          name: 'string',
          cardcode: 'string',
          hide: 'boolean',
          group: {
            belongsTo: 'userGroup'
          }
        },
        selectMany (options) {
          t.deepEqual(
            options.whereIn,
            {
              relationFkName: 'GrpID',
              parentIdFieldName: 'GroupID',
              parentTableName: 'sPepTree',
              parentWhere: {someField: 'parent where constraints'}
            },
            'uses {whereIn} with relationFkName option'
          )

          return Promise.resolve([
            { id: '101', name: 'John', cardcode: '123', hide: false, userGroupId: '1' },
            { id: '102', name: 'Simona', cardcode: '455', hide: false, userGroupId: '1' },
            { id: '103', name: 'Whatson', cardcode: '', hide: false, userGroupId: '2' },
            { id: '104', name: 'Vaschev', cardcode: '9022', hide: false, userGroupId: '2' }
          ])
        }
      },

      division: {
        schema: {
          id: 'DivID',
          tableName: 'sDivisions',
          name: 'string',
          hide: 'boolean',
          someFancyFieldName: {
            belongsTo: 'userGroup'
          }
        },
        selectMany (options) {
          t.deepEqual(
            options.whereIn,
            {
              relationFkName: 'UserGrpID',
              parentIdFieldName: 'GroupID',
              parentTableName: 'sPepTree',
              parentWhere: {someField: 'parent where constraints'}
            },
            'uses {whereIn} with relationFkName option'
          )

          return Promise.resolve([
            { id: '23', name: 'Kitchen', hide: false, userGroupId: '1' },
            { id: '24', name: 'Sad', hide: false, userGroupId: '1' },
            { id: '25', name: 'Mangal', hide: false, userGroupId: '2' },
            { id: '26', name: 'Tandyr', hide: false, userGroupId: '2' }
          ])
        }
      }
    },

    model (modelName) {
      return this._models[modelName]
    }
  }

  const model = {
    name: 'userGroup',
    schema: {
      id: 'GroupID',
      tableName: 'sPepTree',
      name: 'string',
      users: {
        hasMany: 'user',
        fkField: 'GrpID'
      },
      divisions: {
        hasMany: 'division',
        fkField: 'UserGrpID'
      }
    }
  }

  const userGroupRelations = new Relations(model.name, model.schema, registryMock)

  const parentWhere = {someField: 'parent where constraints'}

  userGroupRelations._fetchHasMany(parentWhere)
  .then((relationsData) => {
    t.deepEqual(
      relationsData,
      [
        {
          modelFieldName: 'users',
          parentModelFieldName: 'group',
          rows: [
            { id: '101', name: 'John', cardcode: '123', hide: false, userGroupId: '1' },
            { id: '102', name: 'Simona', cardcode: '455', hide: false, userGroupId: '1' },
            { id: '103', name: 'Whatson', cardcode: '', hide: false, userGroupId: '2' },
            { id: '104', name: 'Vaschev', cardcode: '9022', hide: false, userGroupId: '2' }
          ]
        },
        {
          modelFieldName: 'divisions',
          parentModelFieldName: 'someFancyFieldName',
          rows: [
            { id: '23', name: 'Kitchen', hide: false, userGroupId: '1' },
            { id: '24', name: 'Sad', hide: false, userGroupId: '1' },
            { id: '25', name: 'Mangal', hide: false, userGroupId: '2' },
            { id: '26', name: 'Tandyr', hide: false, userGroupId: '2' }
          ]
        }
      ],
      'fetches hasMany relations data'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('relations._fetchHasMany() if relation model is not found in Registry', (t) => {
  t.plan(1)

  const registryMock = {
    model (modelName) {
      return undefined // simulate
    }
  }

  const model = {
    name: 'userGroup',
    schema: {
      id: 'GroupID',
      tableName: 'sPepTree',
      name: 'string',
      users: {
        hasMany: 'user',
        fkField: 'GrpID'
      }
    }
  }

  const userGroupRelations = new Relations(model.name, model.schema, registryMock)

  userGroupRelations._fetchHasMany()
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.equal(
      e.message,
      "_fetchHasMany: there is no registered 'user' model",
      'it rejects with error'
    )
  })
  .then(() => t.end())
})

test('relations._fetchBelongsTo()', (t) => {
  t.plan(3)

  const registryMock = {
    _models: {
      rights: {
        selectMany (options) {
          t.deepEqual(
            options.whereIn,
            {
              parentFkName: 'rights',
              parentTableName: 'sPersonal',
              parentWhere: {someField: 'parent where constraints'}
            },
            'uses {whereIn} with relationFkName option'
          )

          return Promise.resolve([
            {id: '12', fullName: 'Full'},
            {id: '13', fullName: 'Part'}
          ])
        }
      },

      userGroup: {
        selectMany (options) {
          t.deepEqual(
            options.whereIn,
            {
              parentFkName: 'userGroup',
              parentTableName: 'sPersonal',
              parentWhere: {someField: 'parent where constraints'}
            },
            'uses {whereIn} with relationFkName option'
          )

          return Promise.resolve([
            {id: '101', shortName: 'Admins'},
            {id: '102', shortName: 'Users'}
          ])
        }
      }
    },
    model (modelName) {
      return this._models[modelName]
    }
  }

  const userModel = {
    name: 'user',
    schema: {
      tableName: 'sPersonal',
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  }

  const userRelations = new Relations(userModel.name, userModel.schema, registryMock)

  const parentWhere = {someField: 'parent where constraints'}

  userRelations._fetchBelongsTo(parentWhere)
  .then((relationsData) => {
    t.deepEqual(
      relationsData,
      [
        {
          modelFieldName: 'group',
          fkAs: 'userGroupId',
          rows: [
            {id: '101', shortName: 'Admins'},
            {id: '102', shortName: 'Users'}
          ]
        },
        {
          modelFieldName: 'rights',
          fkAs: 'rightsId',
          rows: [
            {id: '12', fullName: 'Full'},
            {id: '13', fullName: 'Part'}
          ]
        }
      ],
      'fetches relations data'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('relations._fetchBelongsTo() if relation model is not found in Registry', (t) => {
  t.plan(1)

  const registryMock = {
    model (modelName) {
      return undefined // simulate
    }
  }

  const userModel = {
    name: 'user',
    schema: {
      tableName: 'sPersonal',
      name: 'string',
      group: { belongsTo: 'userGroup' }
    }
  }

  const userRelations = new Relations(userModel.name, userModel.schema, registryMock)

  userRelations._fetchBelongsTo()
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.equal(
      e.message,
      "_fetchBelongsTo: there is no registered 'userGroup' model",
      'it rejects with error'
    )
  })
  .then(() => t.end())
})

/**
 * Integration testing
 */
test('I&T Relations _fetchHasMany() + _embedHasMany()', (t) => {
  t.plan(1)

  const registryMock = {
    _models: {
      user: {
        schema: {
          id: 'PersID',
          tableName: 'sPersonal',
          group: { belongsTo: 'userGroup' }
        },
        selectMany () {
          return Promise.resolve([
            { id: '101', name: 'John', cardcode: '123', hide: false, userGroupId: '1' },
            { id: '102', name: 'Simona', cardcode: '455', hide: false, userGroupId: '1' },
            { id: '103', name: 'Whatson', cardcode: '', hide: false, userGroupId: '2' },
            { id: '104', name: 'Vaschev', cardcode: '9022', hide: false, userGroupId: '2' }
          ])
        }
      },

      division: {
        schema: {
          id: 'DivID',
          tableName: 'sDivisions',
          someFancyFieldName: { belongsTo: 'userGroup' }
        },
        selectMany () {
          return Promise.resolve([
            { id: '23', name: 'Kitchen', hide: false, userGroupId: '1' },
            { id: '24', name: 'Sad', hide: false, userGroupId: '1' },
            { id: '25', name: 'Mangal', hide: false, userGroupId: '2' },
            { id: '26', name: 'Tandyr', hide: false, userGroupId: '2' }
          ])
        }
      }
    },

    model (modelName) {
      return this._models[modelName]
    }
  }

  const userGroupModel = {
    name: 'userGroup',
    schema: {
      id: 'GroupID',
      tableName: 'sPepTree',
      users: {
        hasMany: 'user',
        fkField: 'GrpID'
      },
      divisions: {
        hasMany: 'division',
        fkField: 'UserGrpID'
      }
    }
  }

  const userGroupRelations = new Relations(userGroupModel.name, userGroupModel.schema, registryMock)

  const parentRows = [
    {id: '1', name: 'Bartenders', hide: false},
    {id: '2', name: 'Waiters', hide: false}
  ]

  userGroupRelations._fetchHasMany()
  .then((relationsData) => userGroupRelations._embedHasMany(parentRows, relationsData))
  .then((parentRowsWithRelationsData) => {
    t.deepEqual(
      parentRowsWithRelationsData,
      [
        {
          id: '1', name: 'Bartenders', hide: false,
          users: [
            { id: '101', name: 'John', cardcode: '123', hide: false, group: {id: '1'} },
            { id: '102', name: 'Simona', cardcode: '455', hide: false, group: {id: '1'} }
          ],
          divisions: [
            { id: '23', name: 'Kitchen', hide: false, someFancyFieldName: {id: '1'} },
            { id: '24', name: 'Sad', hide: false, someFancyFieldName: {id: '1'} }
          ]
        },
        {
          id: '2', name: 'Waiters', hide: false,
          users: [
            { id: '103', name: 'Whatson', cardcode: '', hide: false, group: {id: '2'} },
            { id: '104', name: 'Vaschev', cardcode: '9022', hide: false, group: {id: '2'} }
          ],
          divisions: [
            { id: '25', name: 'Mangal', hide: false, someFancyFieldName: {id: '2'} },
            { id: '26', name: 'Tandyr', hide: false, someFancyFieldName: {id: '2'} }
          ]
        }
      ],
      'fetches and embeds hasMany relations data'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})

test('I&T Relations _fetchBelongsTo() + _embedBelongsTo()', (t) => {
  t.plan(1)

  const registryMock = {
    _models: {
      rights: {
        selectMany () {
          return Promise.resolve([
            {id: '12', fullName: 'Full'},
            {id: '13', fullName: 'Part'}
          ])
        }
      },

      userGroup: {
        selectMany () {
          return Promise.resolve([
            {id: '101', shortName: 'Admins'},
            {id: '102', shortName: 'Users'}
          ])
        }
      }
    },
    model (modelName) {
      return this._models[modelName]
    }
  }

  const userModel = {
    name: 'user',
    schema: {
      tableName: 'sPersonal',
      name: 'string',
      group: { belongsTo: 'userGroup' },
      rights: { belongsTo: 'rights' }
    }
  }

  const userRelations = new Relations(userModel.name, userModel.schema, registryMock)

  const parentRows = [
    {id: '1', name: 'John', userGroupId: '101', rightsId: '12'},
    {id: '2', name: 'Smith', userGroupId: '102', rightsId: '13'}
  ]

  userRelations._fetchBelongsTo()
  .then((relationsData) => userRelations._embedBelongsTo(parentRows, relationsData))
  .then((parentRowsWithRelationsData) => {
    t.deepEqual(
      parentRowsWithRelationsData,
      [
        {
          id: '1', name: 'John',
          group: { id: '101', shortName: 'Admins' },
          rights: {id: '12', fullName: 'Full'}
        },
        {
          id: '2', name: 'Smith',
          group: {id: '102', shortName: 'Users'},
          rights: {id: '13', fullName: 'Part'}
        }
      ],
      'embeds relations data'
    )
  })
  .catch((e) => t.fail(e))
  .then(() => t.end())
})
