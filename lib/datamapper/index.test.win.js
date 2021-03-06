'use strict'

const test = require('tape')

const config = require('../config.js')
const adapterOptions = {dsn: config.d2alias}

const {recordTypes, initialData, prepareTestTables} = require('../adapter/_prepare-test-db')

const Context = require('./context')
const DataMapper = require('./index')

test('I&T datamapper.find()', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.find(new Context({
    type: 'user'
  })))
  .then((context) => t.deepEqual(
    context.response.payload.records,
    [
      {id: 1, name: 'John', deleted: false, group: 1},
      {id: 2, name: 'Smith', deleted: false, group: 1},
      {id: 3, name: 'Johanna', deleted: false, group: 2},
      {id: 4, name: 'Ann', deleted: true, group: 2},
      {id: 5, name: 'Makbeth', deleted: false, group: 2}
    ],
    'by default it fetches all records'
  ))

  .then(() => mapper.find(new Context({
    type: 'user',
    ids: [1, 2, 3, 5]
  })))
  .then((context) => t.deepEqual(
    context.response,
    {
      payload: {
        records: [
          {id: 1, name: 'John', deleted: false, group: 1},
          {id: 2, name: 'Smith', deleted: false, group: 1},
          {id: 3, name: 'Johanna', deleted: false, group: 2},
          {id: 5, name: 'Makbeth', deleted: false, group: 2}
        ]
      }
    },
    'with ids'
  ))

  .then(() => mapper.find(new Context({
    type: 'user',
    options: {
      match: {group: 1}
    }
  })))
  .then((context) => t.deepEqual(
    context.response,
    {
      payload: {
        records: [
          {id: 1, name: 'John', deleted: false, group: 1},
          {id: 2, name: 'Smith', deleted: false, group: 1}
        ]
      }
    },
    'with options.match belongsTo'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.find() include belongsTo: w/ and w/o additional options', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.find(new Context({
    type: 'user',
    include: [['group']]
  })))
  .then((context) => t.deepEqual(
    context.response,
    {
      payload: {
        records: [
          {id: 1, name: 'John', deleted: false, group: 1},
          {id: 2, name: 'Smith', deleted: false, group: 1},
          {id: 3, name: 'Johanna', deleted: false, group: 2},
          {id: 4, name: 'Ann', deleted: true, group: 2},
          {id: 5, name: 'Makbeth', deleted: false, group: 2}
        ],
        include: {
          group: [
            {id: 1, name: 'Admins', deleted: false},
            {id: 2, name: 'Users', deleted: false}
            // {id: 3, name: 'Officers', deleted: true} - this group is not used
          ]
        }
      }
    },
    '"include" option with belongsTo'
  ))

  .then(() => mapper.find(new Context({
    type: 'user',
    options: {
      match: {deleted: false},
      fieldsOnly: ['id', 'name'] // 'group' will be added b/c of 'include'
    },
    include: [['group', {fieldsOnly: ['id', 'name']}]]
  })))
  .then((context) => t.deepEqual(
    context.response,
    {
      payload: {
        records: [
          {id: 1, name: 'John', group: 1},
          {id: 2, name: 'Smith', group: 1},
          {id: 3, name: 'Johanna', group: 2},
          {id: 5, name: 'Makbeth', group: 2}
        ],
        include: {
          group: [
            {id: 1, name: 'Admins'},
            {id: 2, name: 'Users'}
          ]
        }
      }
    },
    '"include" belongsTo with additional options'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.find() `include` belongsTo and `fieldsOnly`', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.find(new Context({
    type: 'user',
    include: [['group']],
    options: {fieldsOnly: ['id', 'name']} // 'group' is filtered out
  })))
  .then((context) => t.deepEqual(
    context.response,
    {
      payload: {
        records: [
          {id: 1, name: 'John', group: 1},
          {id: 2, name: 'Smith', group: 1},
          {id: 3, name: 'Johanna', group: 2},
          {id: 4, name: 'Ann', group: 2},
          {id: 5, name: 'Makbeth', group: 2}
        ],
        include: {
          group: [
            {id: 1, name: 'Admins', deleted: false},
            {id: 2, name: 'Users', deleted: false}
          ]
        }
      }
    },
    '"include" option includes belongsTo even if it is filtered out by `fieldsOnly`'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.find() include hasMany', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.find(new Context({
    type: 'group',
    include: [['users']]
  })))
  .then((context) => t.deepEqual(
    context.response,
    {
      payload: {
        records: [
          {id: 1, name: 'Admins', deleted: false, users: [1, 2]},
          {id: 2, name: 'Users', deleted: false, users: [3, 4, 5]},
          {id: 3, name: 'Officers', deleted: true, users: []}
        ],
        include: {
          user: [
            {id: 1, name: 'John', deleted: false, group: 1},
            {id: 2, name: 'Smith', deleted: false, group: 1},
            {id: 3, name: 'Johanna', deleted: false, group: 2},
            {id: 4, name: 'Ann', deleted: true, group: 2},
            {id: 5, name: 'Makbeth', deleted: false, group: 2}
          ]
        }
      }
    },
    '"include" everything with hasMany'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.find() include hasMany w/ additional options', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.find(new Context({
    type: 'group',
    include: [['users', {match: {deleted: false}, fieldsOnly: ['name']}]]
  })))
  .then((context) => t.deepEqual(
    context.response,
    {
      payload: {
        records: [
          {id: 1, name: 'Admins', deleted: false, users: [1, 2]},
          {id: 2, name: 'Users', deleted: false, users: [3, 5]},
          {id: 3, name: 'Officers', deleted: true, users: []}
        ],
        include: {
          user: [
            {id: 1, name: 'John', group: 1},
            {id: 2, name: 'Smith', group: 1},
            {id: 3, name: 'Johanna', group: 2},
            {id: 5, name: 'Makbeth', group: 2}
          ]
        }
      }
    },
    '"include" hasMany merges additional options'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.find() w/o `include` but w/ hasMany fields', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.find(new Context({
    type: 'group'
  })))
  .then((context) => t.deepEqual(
    context.response,
    {
      payload: {
        records: [
          {id: 1, name: 'Admins', deleted: false, users: [1, 2]},
          {id: 2, name: 'Users', deleted: false, users: [3, 4, 5]},
          {id: 3, name: 'Officers', deleted: true, users: []}
        ]
      }
    },
    'return embedded hasMany ids'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.request() find belongsTo', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.request({
    method: 'find',
    type: 'user',
    options: {
      match: {deleted: false},
      fieldsOnly: ['id', 'name'] // 'group' will be added b/c of 'include'
    },
    include: [['group', {fieldsOnly: ['id', 'name']}]]
  }))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'John', group: 1},
          {id: 2, name: 'Smith', group: 1},
          {id: 3, name: 'Johanna', group: 2},
          {id: 5, name: 'Makbeth', group: 2}
        ],
        include: {
          group: [
            {id: 1, name: 'Admins'},
            {id: 2, name: 'Users'}
          ]
        }
      }
    },
    '"include" belongsTo with additional options'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.request() find hasMany', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.request({
    method: 'find',
    type: 'group',
    include: [['users', {match: {deleted: false}, fieldsOnly: ['name']}]]
  }))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'Admins', deleted: false, users: [1, 2]},
          {id: 2, name: 'Users', deleted: false, users: [3, 5]},
          {id: 3, name: 'Officers', deleted: true, users: []}
        ],
        include: {
          user: [
            {id: 1, name: 'John', group: 1},
            {id: 2, name: 'Smith', group: 1},
            {id: 3, name: 'Johanna', group: 2},
            {id: 5, name: 'Makbeth', group: 2}
          ]
        }
      }
    },
    '"include" hasMany with additional options'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.request() find `fieldsOnly` can filter out array links as well', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.request({
    method: 'find', type: 'group',
    options: {fieldsOnly: ['id', 'name', 'deleted']} // filter out array link field
  }))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'Admins', deleted: false},
          {id: 2, name: 'Users', deleted: false},
          {id: 3, name: 'Officers', deleted: true}
        ]
      }
    }
  ))
  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.request() find `include` and `fieldsOnly` filters out `id`', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.request({
    method: 'find', type: 'group',
    include: [['users']], // request to include array link
    options: {fieldsOnly: ['name']} // `id` is filtered out
  }))
  .then(() => t.fail('should not resolve ok'))
  .catch((e) => t.equal(
    e.message,
    'wrong query: `include` option with `id` filtered out by `fieldsOnly`',
    '`id` is required when `include` requests array link data'
  ))

  .then(t.end)
})

test('I&T datamapper.create() saves records with "good" referential integrity', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables({groups: [], users: []}) // we need empty tables

  .then(() => mapper.request({method: 'find', type: 'group'}))
  .then((response) => t.equal(response.status, 'empty', 'groups are empty at the start'))
  .catch(t.fail)

  .then(() => mapper.create(new Context({
    type: 'group',
    payload: [
      {name: 'Admins', deleted: false},
      {name: 'Users', deleted: false},
      {name: 'Officers', deleted: true}
    ]
  })))
  .then((context) => t.equal(
    context.response.payload.records.length,
    3,
    'it has committed transaction'
  ))
  .catch(t.fail)

  .then(() => mapper.request({method: 'find', type: 'group'}))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'Admins', deleted: false},
          {id: 2, name: 'Users', deleted: false},
          {id: 3, name: 'Officers', deleted: true}
        ]
      }
    },
    'transaction ended. ensure that data has been saved'
  ))
  .catch(t.fail)

  .then(() => mapper.create(new Context({
    type: 'user',
    payload: [
      {name: 'John', deleted: false, config: 1, group: 1, password: '333'},
      {name: 'Smith', deleted: false, config: 3, group: 1, password: '123'},
      {name: 'Johanna', deleted: false, config: 2, group: 2, password: '321'},
      {name: 'Ann', deleted: true, config: 3, group: 2, password: '11111'},
      {name: 'Makbeth', deleted: false, config: 3, group: 2, password: 'fffgg'}
    ]
  })))
  .then((context) => t.equal(
    context.response.payload.records.length,
    5,
    'it has committed transaction with right referentials'
  ))
  .catch(t.fail)

  .then(() => mapper.request({method: 'find', type: 'user'}))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'John', deleted: false, group: 1},
          {id: 2, name: 'Smith', deleted: false, group: 1},
          {id: 3, name: 'Johanna', deleted: false, group: 2},
          {id: 4, name: 'Ann', deleted: true, group: 2},
          {id: 5, name: 'Makbeth', deleted: false, group: 2}
        ]
      }
    },
    'transaction ended. ensure that data has been saved'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.create() aborts transaction with "bad" referential integrity', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables({groups: [], users: []}) // we need empty tables

  .then(() => mapper.create(new Context({
    type: 'group',
    payload: [ {name: 'Admins'}, {name: 'Users'} ]
  })))
  .catch(t.fail)

  .then(() => mapper.request({method: 'find', type: 'group'}))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'Admins', deleted: false},
          {id: 2, name: 'Users', deleted: false}
        ]
      }
    },
    'transaction ended. ensure the data has been saved'
  ))
  .catch(t.fail)

  .then(() => mapper.create(new Context({
    type: 'user',
    payload: [
      {name: 'John', config: 1, group: 1},
      {name: 'Smith', config: 3, group: 2},
      {name: 'Johanna', config: 2, group: 3} // there is no group:3
    ]
  })))
  .then(() => t.fail('should not be saved b/c of bad referential integrity'))
  .catch((e) => t.equal(
    e.message,
    "RelatedRecordNotFound: there is no record with id: '3' in 'group' type",
    'it point out where is the wrong ref'
  ))

  .then(() => mapper.request({method: 'find', type: 'user'}))
  .then((response) => t.equal(response.status, 'empty', 'transaction should be aborted'))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.request() method `create`', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables({groups: [], users: []}) // we need empty tables

  .then(() => mapper.request({
    method: 'create',
    type: 'group',
    payload: [ {name: 'Admins'}, {name: 'Users'} ]
  }))
  .then((response) => t.deepEqual(
    response.payload,
    {
      records: [
        {name: 'Admins', deleted: false, id: 1},
        {name: 'Users', deleted: false, id: 2}
      ]
    },
    'it returns saved records with assigned ids'
  ))
  .catch(t.fail)

  .then(() => mapper.request({method: 'find', type: 'group'}))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'Admins', deleted: false},
          {id: 2, name: 'Users', deleted: false}
        ]
      }
    },
    'transaction ended. ensure the data has been saved'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.delete() with no `ids`', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.request({method: 'find', type: 'group'}))
  .then((response) => t.equal(response.payload.records.length, 3, 'there are 3 groups'))

  .then(() => mapper.delete(new Context({
    type: 'group'
    // no `ids`
  })))
  .then((context) => t.equal(context.response.payload, null))
  .catch(t.fail)

  .then(() => mapper.request({method: 'find', type: 'group'}))
  .then((response) => t.equal(
    response.status, 'empty',
    'w/o `ids` it deletes all records'
  ))

  // referential integrity
  .then(() => mapper.request({method: 'find', type: 'user'}))
  .then((response) => t.deepEqual(
    response.payload.records,
    [
      {id: 1, name: 'John', deleted: false, group: null},
      {id: 2, name: 'Smith', deleted: false, group: null},
      {id: 3, name: 'Johanna', deleted: false, group: null},
      {id: 4, name: 'Ann', deleted: true, group: null},
      {id: 5, name: 'Makbeth', deleted: false, group: null}
    ],
    'it nullyfies relations'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.delete() with `ids` provided', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.request({method: 'find', type: 'group'}))
  .then((response) => t.equal(response.payload.records.length, 3, 'there are 3 groups'))

  .then(() => mapper.delete(new Context({
    type: 'group',
    ids: [1, 3]
  })))
  .then((context) => t.equal(context.response.payload, null))
  .catch(t.fail)

  .then(() => mapper.request({method: 'find', type: 'group'}))
  .then((response) => t.deepEqual(
    response.payload.records,
    [
      { deleted: false, id: 2, name: 'Users', users: [3, 4, 5] }
    ],
    'it deletes provided `ids`'
  ))

  // referential integrity
  .then(() => mapper.request({method: 'find', type: 'user'}))
  .then((response) => t.deepEqual(
    response.payload.records,
    [
      {id: 1, name: 'John', deleted: false, group: null}, // nullyfied
      {id: 2, name: 'Smith', deleted: false, group: null}, // nullyfied
      {id: 3, name: 'Johanna', deleted: false, group: 2},
      {id: 4, name: 'Ann', deleted: true, group: 2},
      {id: 5, name: 'Makbeth', deleted: false, group: 2}
    ],
    'it nullyfies relations'
  ))

  .catch(t.fail)
  .then(t.end)
})

const {recordTypes2, prepareTestTables2} = require('../adapter/_prepare-test-db-2')

test('I&T datamapper.delete() referential integrity w/ several one-to-many', (t) => {
  const mapper = new DataMapper(recordTypes2, adapterOptions)

  prepareTestTables2()

  .then(() => mapper.request({method: 'find', type: 'tag'}))
  .then((response) => t.equal(response.payload.records.length, 5, 'there are 3 tags'))

  .then(() => mapper.delete(new Context({
    type: 'tag',
    ids: [1, 2, 4]
  })))
  .then((context) => t.equal(context.response.payload, null))
  .catch(t.fail)

  .then(() => mapper.request({method: 'find', type: 'tag'}))
  .then((response) => t.equal(response.payload.records.length, 2, 'there are 2 tags left'))

  // referential integrity
  .then(() => mapper.request({method: 'find', type: 'post'}))
  .then((response) => t.deepEqual(
    response.payload.records,
    [
      {id: 1, postTag: null, subTag: null, text: 'text of the post1'},
      {id: 2, postTag: null, subTag: null, text: 'text of the post2'},
      {id: 3, postTag: null, subTag: 5, text: 'text of the post3'},
      {id: 4, postTag: null, subTag: null, text: 'text of the post4'},
      {id: 5, postTag: 3, subTag: null, text: 'text of the post5'}
    ],
    'it nullyfies relations in posts'
  ))

  .then(() => mapper.request({method: 'find', type: 'message'}))
  .then((response) => t.deepEqual(
    response.payload.records,
    [
      {id: 1, msgTag: 3, text: 'long message 1'},
      {id: 2, msgTag: null, text: 'long message 2'},
      {id: 3, msgTag: null, text: 'long message 3'}
    ],
    'it nullyfies relations in messages'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.update() w/o update-transform', (t) => {
  const mapper = new DataMapper(recordTypes, adapterOptions)

  prepareTestTables(initialData)

  .then(() => mapper.request({method: 'find', type: 'group'}))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'Admins', deleted: false, users: [1, 2]},
          {id: 2, name: 'Users', deleted: false, users: [3, 4, 5]},
          {id: 3, name: 'Officers', deleted: true, users: []}
        ]
      }
    },
    'the state of groups before updates'
  ))
  .catch(t.fail)

  .then(() => mapper.update(new Context({
    type: 'group',
    payload: [
      {id: 1, name: 'Admins New', deleted: false},
      {id: 2, name: 'Users Updated', deleted: false},
      {id: 3, name: 'Officers Also', deleted: false}
    ]
  })))
  .catch(t.fail)
  .then(() => t.pass('it resolves positively in the case of success'))

  .then(() => mapper.request({method: 'find', type: 'group'}))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'Admins New', deleted: false, users: [1, 2]},
          {id: 2, name: 'Users Updated', deleted: false, users: [3, 4, 5]},
          {id: 3, name: 'Officers Also', deleted: false, users: []}
        ]
      }
    },
    'transaction ended. ensure the updates have been saved'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.update() w/ update-transform', (t) => {
  const options = Object.assign({}, adapterOptions, {
    transforms: {
      group: {
        input: {
          update (context, record, update) {
            if (record.deleted !== update.deleted) {
              const name = update.name || record.name
              update.name = name + ' updated'
            }
            return update
          }
        }
      }
    }
  })
  const mapper = new DataMapper(recordTypes, options)

  prepareTestTables(initialData)

  .then(() => mapper.request({method: 'find', type: 'group'}))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'Admins', deleted: false, users: [1, 2]},
          {id: 2, name: 'Users', deleted: false, users: [3, 4, 5]},
          {id: 3, name: 'Officers', deleted: true, users: []}
        ]
      }
    },
    'the state of groups before updates'
  ))
  .catch(t.fail)

  .then(() => mapper.update(new Context({
    type: 'group',
    payload: [
      {id: 2, name: 'New2', deleted: true}, // delete
      {id: 3, deleted: false} // undelete
    ]
  })))
  .catch(t.fail)
  .then(() => t.pass('it resolves positively in the case of success'))

  .then(() => mapper.request({method: 'find', type: 'group'}))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'Admins', deleted: false, users: [1, 2]},
          {id: 2, name: 'New2 updated', deleted: true, users: [3, 4, 5]},
          {id: 3, name: 'Officers updated', deleted: false, users: []}
        ]
      }
    },
    'transaction ended. ensure the updates have been saved'
  ))

  .catch(t.fail)
  .then(t.end)
})

test('I&T datamapper.update() referential integrity', (t) => {
  const options = Object.assign({}, adapterOptions, {
    transforms: {
      user: {
        input: {
          update (context, record, update) {
            if (record.deleted !== update.deleted) {
              const name = update.name || record.name
              update.name = name + ' updated'
            }
            return update
          }
        }
      }
    }
  })
  const mapper = new DataMapper(recordTypes, options)

  prepareTestTables(initialData)

  .then(() => mapper.request({method: 'find', type: 'user'}))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'John', deleted: false, group: 1},
          {id: 2, name: 'Smith', deleted: false, group: 1},
          {id: 3, name: 'Johanna', deleted: false, group: 2},
          {id: 4, name: 'Ann', deleted: true, group: 2},
          {id: 5, name: 'Makbeth', deleted: false, group: 2}
        ]
      }
    },
    'the state of users before update'
  ))
  .catch(t.fail)

  .then(() => mapper.update(new Context({
    type: 'user',
    payload: [
      {id: 1, name: 'New John', group: 4} // group:4 does not exist
    ]
  })))
  .then(() => t.fail('it should not resolve OK'))
  .catch((e) => t.equal(
    e.message,
    "RelatedRecordNotFound: there is no record with id: '4' in 'group' type",
    'it points out to the wrong RI'
  ))

  .then(() => mapper.update(new Context({
    type: 'user',
    payload: [
      {id: 1, name: 'New John', group: 2}, // change relation group:1 => :2
      {id: 2, group: 3} // group:1 => :3
    ]
  })))
  .catch(t.fail)
  .then(() => t.pass('it resolves positively in the case of success'))

  .then(() => mapper.request({method: 'find', type: 'user', ids: [1, 2]}))
  .then((response) => t.deepEqual(
    response,
    {
      status: 'ok',
      payload: {
        records: [
          {id: 1, name: 'New John updated', deleted: false, group: 2},
          {id: 2, name: 'Smith updated', deleted: false, group: 3}
        ]
      }
    },
    'transaction ended. RI has been successfully updated'
  ))

  .catch(t.fail)
  .then(t.end)
})
