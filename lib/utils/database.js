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

let cachedDb

module.exports = {
  Database, // for testing

  getDatabase () {
    if (!cachedDb) {
      const getDatabase = require('webd2-db').getDatabase
      const db = getDatabase(`DSN=${process.env.D2ALIAS}`)
      cachedDb = new Database(db)
    }

    return cachedDb
  }
}
