function DbError (message) {
  this.message = message
  this.stack = new Error().stack
  this.code = 500
  this.errorType = this.name
}

DbError.prototype = Object.create(Error.prototype)
DbError.prototype.name = 'DatabaseError'

export {
  DbError
}
