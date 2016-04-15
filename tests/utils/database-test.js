'use strict'
const test = require('tape')

const {Database} = require('../../lib/utils/database')

test('Database is a wrapper about odbc-db layer', (t) => {
  t.plan(2)

  const dbOdbc = {
    exec (sql) {
      t.equal(sql, 'some sql')
      return Promise.resolve([{name: 'some data'}])
    }
  }

  const db = new Database(dbOdbc)

  db.exec('some sql')
  .then((data) => {
    t.equal(data[0].name, 'some data', 'returns some data')
  })
  .catch(() => t.fail('should not be called'))
  .then(() => t.end())
})

test('Database#exec catches db-layer error message and returns it as Error object', (t) => {
  t.plan(3)

  const dbOdbc = {
    exec (sql) {
      t.equal(sql, 'some sql')
      return Promise.reject('db error message')
    }
  }

  const db = new Database(dbOdbc)

  db.exec('some sql')
  .then(() => t.fail('should not be called'))
  .catch((e) => {
    t.pass('catch db error')
    t.assert(/db error message/.test(e.message), 'assert error message')
    t.end()
  })
})
