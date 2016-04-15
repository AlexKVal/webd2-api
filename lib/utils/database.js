'use strict'
const {
  DbError
} = require('jsonapi-errors/lib/errors')

class Database {
  constructor (db) {
    this.db = db
  }
  exec (sql) {
    return this.db.exec(sql)
    .catch((dbMsg) => Promise.reject(new DbError(dbMsg)))
  }
}

module.exports = {
  Database, // for testing

  getDatabase () {
    const getDatabase = require('webd2-db').getDatabase
    const db = getDatabase(`DSN=${process.env.D2ALIAS}`)

    return new Database(db)
  }
}
